'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface MobileNavProps {
  onClose?: () => void;
}

export function MobileNav({ onClose }: MobileNavProps) {
  const links = [
    ['Dashboard', '/dashboard'],
    ['Marketplace', '/marketplace'],
    ['Post Item', '/post-item'],
    ['My Listings', '/my-listings'],
    ['Exchange Requests', '/exchange-requests'],
    ['Messages', '/messages'],
    ['Wanted', '/wanted'],
    ['Notifications', '/notifications'],
    ['Profile', '/profile'],
    ['Settings', '/settings'],
  ];

  return (
    <nav className="flex flex-col gap-1 p-2">
      {links.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          onClick={onClose}
          className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          {label}
        </Link>
      ))}
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
      >
        Logout
      </button>
    </nav>
  );
}
