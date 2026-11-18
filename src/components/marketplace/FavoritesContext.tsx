'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface FavoritesContextType {
  favoritedIds: Set<string>;
  isFavorited: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favoritedIds: new Set(),
  isFavorited: () => false,
  toggleFavorite: async () => false,
  refreshFavorites: async () => {},
  loading: false,
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (status !== 'authenticated') {
      setFavoritedIds(new Set());
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/favorites', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.favoritedListingIds)) {
          setFavoritedIds(new Set(data.favoritedListingIds));
        }
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Listen to cross-component sync events
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ listingId: string; favorited: boolean }>;
      if (customEvent.detail) {
        const { listingId, favorited } = customEvent.detail;
        setFavoritedIds((prev) => {
          const next = new Set(prev);
          if (favorited) {
            next.add(listingId);
          } else {
            next.delete(listingId);
          }
          return next;
        });
      }
    };

    window.addEventListener('baust:favorite-change', handleSync);
    return () => window.removeEventListener('baust:favorite-change', handleSync);
  }, []);

  const isFavorited = useCallback(
    (listingId: string) => {
      return favoritedIds.has(listingId);
    },
    [favoritedIds]
  );

  const toggleFavorite = useCallback(
    async (listingId: string): Promise<boolean> => {
      if (!listingId) return false;

      const currentlyFavorited = favoritedIds.has(listingId);
      const nextFavorited = !currentlyFavorited;

      // Optimistic update
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (nextFavorited) {
          next.add(listingId);
        } else {
          next.delete(listingId);
        }
        return next;
      });

      // Dispatch event to sync immediately across tabs / components
      window.dispatchEvent(
        new CustomEvent('baust:favorite-change', {
          detail: { listingId, favorited: nextFavorited },
        })
      );

      try {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
        });

        if (!res.ok) {
          throw new Error('Failed to update favorite');
        }

        const data = await res.json();
        const serverFavorited = Boolean(data.favorited);

        // Ensure state matches server response
        if (serverFavorited !== nextFavorited) {
          setFavoritedIds((prev) => {
            const next = new Set(prev);
            if (serverFavorited) {
              next.add(listingId);
            } else {
              next.delete(listingId);
            }
            return next;
          });
          window.dispatchEvent(
            new CustomEvent('baust:favorite-change', {
              detail: { listingId, favorited: serverFavorited },
            })
          );
        }

        return serverFavorited;
      } catch (err) {
        console.error('Error toggling favorite:', err);
        // Rollback on error
        setFavoritedIds((prev) => {
          const next = new Set(prev);
          if (currentlyFavorited) {
            next.add(listingId);
          } else {
            next.delete(listingId);
          }
          return next;
        });
        window.dispatchEvent(
          new CustomEvent('baust:favorite-change', {
            detail: { listingId, favorited: currentlyFavorited },
          })
        );
        return currentlyFavorited;
      }
    },
    [favoritedIds]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoritedIds,
        isFavorited,
        toggleFavorite,
        refreshFavorites: fetchFavorites,
        loading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
