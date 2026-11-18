'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, Image as ImageIcon } from 'lucide-react';

export interface GalleryImage {
  id: string;
  url: string;
  order?: number;
}

export interface ProductImageGalleryProps {
  images?: GalleryImage[];
  title: string;
}

export function ProductImageGallery({ images = [], title }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const thumbnailsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[selectedIndex] || images[0] : null;

  // Keep selected index within bounds if images change
  useEffect(() => {
    if (selectedIndex >= images.length) {
      setSelectedIndex(0);
    }
  }, [images.length, selectedIndex]);

  // Navigate to specific index with smooth transition
  const goToImage = useCallback(
    (index: number) => {
      if (!hasImages) return;
      let nextIndex = index;
      if (nextIndex < 0) nextIndex = images.length - 1;
      if (nextIndex >= images.length) nextIndex = 0;

      setIsTransitioning(true);
      setSelectedIndex(nextIndex);

      // Auto-scroll the thumbnail into view
      const thumb = thumbnailsRef.current[nextIndex];
      if (thumb) {
        thumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }

      setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
    },
    [hasImages, images.length]
  );

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      goToImage(selectedIndex - 1);
    },
    [goToImage, selectedIndex]
  );

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      goToImage(selectedIndex + 1);
    },
    [goToImage, selectedIndex]
  );

  // Keyboard navigation when Lightbox is open
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        goToImage(selectedIndex - 1);
      } else if (e.key === 'ArrowRight') {
        goToImage(selectedIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isLightboxOpen, selectedIndex, goToImage]);

  if (!hasImages) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 border border-gray-200">
        <ImageIcon className="w-12 h-12 stroke-[1.5] mb-2 text-gray-300" />
        <span className="text-sm font-medium">No image available</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {/* 1. Large Main Product Image */}
      <div
        onClick={() => setIsLightboxOpen(true)}
        className="relative aspect-[4/3] w-full bg-gray-50 border border-gray-200 rounded-xl overflow-hidden cursor-zoom-in group select-none shadow-xs"
        title="Click to view full screen"
      >
        {/* Main Image with Aspect Ratio Preservation */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage?.url}
          alt={`${title} - Image ${selectedIndex + 1}`}
          className={`w-full h-full object-contain p-2 transition-opacity duration-200 ease-in-out ${
            isTransitioning ? 'opacity-40' : 'opacity-100'
          }`}
          loading="eager"
        />

        {/* Hover Zoom Prompt Badge */}
        <div className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-sm">
          <Maximize2 className="w-4 h-4" />
        </div>

        {/* Previous / Next Arrow Controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500 z-10 opacity-80 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500 z-10 opacity-80 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>

            {/* Image Index Counter Badge */}
            <div className="absolute bottom-2.5 right-2.5 bg-black/65 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full pointer-events-none shadow-xs">
              {selectedIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* 2. Clickable Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {images.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img.id || idx}
                ref={(el) => {
                  thumbnailsRef.current[idx] = el;
                }}
                type="button"
                onClick={() => goToImage(idx)}
                aria-label={`Select product image ${idx + 1}`}
                className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-50 transition-all duration-150 focus:outline-none ${
                  isSelected
                    ? 'border-2 border-brand-500 ring-2 ring-brand-500/25 shadow-xs scale-102 opacity-100'
                    : 'border border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-300'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`${title} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* 6. Full-Screen Image Lightbox Preview */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image Preview"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Header Bar */}
          <div
            className="flex items-center justify-between w-full max-w-6xl mx-auto text-white z-10 shrink-0 pb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs sm:text-sm font-medium text-gray-300 truncate max-w-[70vw]">
              <span className="text-white font-semibold">{title}</span>
              {images.length > 1 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs">
                  {selectedIndex + 1} of {images.length}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close image preview"
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Center Image Container */}
          <div
            className="relative flex-1 flex items-center justify-center max-w-6xl w-full mx-auto overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage?.url}
              alt={`${title} - Preview ${selectedIndex + 1}`}
              className="max-h-[72vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-2xl transition-transform duration-200"
            />

            {/* Lightbox Previous / Next Buttons */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous image"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next image"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Strip */}
          {images.length > 1 && (
            <div
              className="w-full max-w-xl mx-auto flex items-center justify-center gap-2 overflow-x-auto pt-2 shrink-0 scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => goToImage(idx)}
                    className={`relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-md overflow-hidden transition-all duration-150 ${
                      isSelected
                        ? 'border-2 border-brand-400 scale-105 opacity-100 ring-2 ring-brand-400/30'
                        : 'border border-white/20 opacity-40 hover:opacity-80'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
