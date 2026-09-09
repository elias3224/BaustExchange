'use client';

import { createContext, useContext, ReactNode } from 'react';

type SessionContextType = {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    status?: string;
    department?: string | null;
  };
};

// A lightweight client-side session accessor. We read from the SessionProvider
// (next-auth) directly, but expose a typed helper for convenience.
const Ctx = createContext<SessionContextType>({});

export function SessionProviderInner({ children, user }: { children: ReactNode; user: any }) {
  return <Ctx.Provider value={{ user }}>{children}</Ctx.Provider>;
}

export function useSessionUser() {
  const ctx = useContext(Ctx);
  return ctx.user;
}

export function RoleBadge({ role }: { role?: string }) {
  if (!role) return null;
  const label = role === 'teacher' ? 'Teacher' : role === 'admin' ? 'Admin' : null;
  if (!label) return null;
  const color =
    role === 'admin'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}
      title={role}
    >
      {label}
    </span>
  );
}
