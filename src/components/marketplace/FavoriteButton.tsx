'use client';

import React from 'react';
import { useFavorites } from '@/components/marketplace/FavoritesContext';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function FavoriteButton({
  listingId,
  className = '',
  size = 'md',
}: {
  listingId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const { status } = useSession();
  const favorited = isFavorited(listingId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status !== 'authenticated') {
      window.location.href = '/login';
      return;
    }

    await toggleFavorite(listingId);
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={favorited ? 'Remove from Wanted Items' : 'Add to Wanted Items'}
      title={favorited ? 'Favorited (in Wanted Items)' : 'Add to Wanted Items'}
      className={`inline-flex items-center justify-center rounded-full transition-all duration-150 active:scale-90 ${className}`}
    >
      <Heart
        className={`${iconSizes[size]} transition-colors duration-150 ${
          favorited
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 hover:text-red-500'
        }`}
      />
    </button>
  );
}
