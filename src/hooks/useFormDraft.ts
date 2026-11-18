'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface UseFormDraftOptions<T> {
  formId: string;
  initialValues: T;
  debounceMs?: number;
  maxAgeMs?: number; // default: 7 days
}

interface DraftEnvelope<T> {
  data: T;
  updatedAt: number;
  userId: string;
  version: number;
}

export function useFormDraft<T extends Record<string, any>>({
  formId,
  initialValues,
  debounceMs = 400,
  maxAgeMs = 7 * 24 * 60 * 60 * 1000,
}: UseFormDraftOptions<T>) {
  const { data: session } = useSession();
  const userId = session?.user?.id || 'guest';
  const storageKey = `baust_draft_${formId}_${userId}`;

  const [values, setValues] = useState<T>(initialValues);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isInitializedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const latestValuesRef = useRef<T>(initialValues);

  latestValuesRef.current = values;

  // 1. Restore draft on mount or when userId changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const envelope: DraftEnvelope<T> = JSON.parse(raw);
        const age = Date.now() - (envelope.updatedAt || 0);

        // Check freshness and user isolation
        if (age < maxAgeMs && envelope.userId === userId && envelope.data) {
          // Check if draft contains actual user input
          const hasInput = Object.entries(envelope.data).some(([key, val]) => {
            const initial = initialValues[key];
            return val !== initial && val !== '' && val !== null && val !== undefined;
          });

          if (hasInput) {
            setValues(envelope.data);
            setHasRestoredDraft(true);
            setLastSaved(new Date(envelope.updatedAt));
          }
        } else if (age >= maxAgeMs) {
          // Clean up expired draft
          localStorage.removeItem(storageKey);
        }
      }
    } catch (err) {
      console.warn('Failed to restore form draft:', err);
    } finally {
      isInitializedRef.current = true;
    }
  }, [storageKey, userId, maxAgeMs]);

  // 2. Debounced auto-save on value changes
  useEffect(() => {
    if (!isInitializedRef.current || typeof window === 'undefined') return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        const currentData = latestValuesRef.current;
        // Verify if data is worth saving (not completely blank)
        const hasContent = Object.entries(currentData).some(([key, val]) => {
          const initial = initialValues[key];
          return val !== initial && val !== '' && val !== null && val !== undefined;
        });

        if (hasContent) {
          const envelope: DraftEnvelope<T> = {
            data: currentData,
            updatedAt: Date.now(),
            userId,
            version: 1,
          };
          localStorage.setItem(storageKey, JSON.stringify(envelope));
          setLastSaved(new Date(envelope.updatedAt));
        }
      } catch (err) {
        console.warn('Failed to autosave form draft:', err);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [values, storageKey, userId, debounceMs]);

  // 3. Clear draft explicitly upon successful submission
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(storageKey);
      setHasRestoredDraft(false);
      setLastSaved(null);
    } catch {}
  }, [storageKey]);

  // 4. Discard draft: wipes storage and resets to initial values
  const discardDraft = useCallback(() => {
    clearDraft();
    setValues(initialValues);
  }, [clearDraft, initialValues]);

  return {
    values,
    setValues,
    hasRestoredDraft,
    lastSaved,
    clearDraft,
    discardDraft,
  };
}
