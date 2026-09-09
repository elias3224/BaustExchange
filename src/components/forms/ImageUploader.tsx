'use client';

import { useState } from 'react';
import { X, Upload, ImagePlus } from 'lucide-react';

interface ImageUploaderProps {
  previews: string[];
  images: File[];
  onRemove: (idx: number) => void;
  onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDropFiles?: (files: File[]) => void;
}

export function ImageUploader({
  previews,
  images,
  onRemove,
  onAdd,
  onDropFiles,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDragOver(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (droppedFiles.length > 0) {
      if (onDropFiles) {
        onDropFiles(droppedFiles);
      } else {
        // Fallback fake event
        const dt = new DataTransfer();
        droppedFiles.forEach((f) => dt.items.add(f));
        onAdd({ target: { files: dt.files } } as any);
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-800">
          Item Images <span className="text-xs text-gray-500 font-normal">(Max 6 images)</span>
        </label>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
          {images.length} / 6 uploaded
        </span>
      </div>

      {/* Main Drag & Drop Zone */}
      {images.length < 6 && (
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/70 scale-[1.01]'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100/80 hover:border-emerald-400'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-emerald-100/80 flex items-center justify-center mb-2 text-emerald-600">
            {isDragging ? <ImagePlus className="w-6 h-6 animate-bounce" /> : <Upload className="w-6 h-6" />}
          </div>
          <p className="text-sm font-bold text-gray-700 text-center">
            {isDragging ? 'Drop images here now' : 'Drag & drop item photos here'}
          </p>
          <p className="text-xs text-gray-500 text-center mt-1">
            or <span className="text-emerald-600 font-semibold underline">browse files</span> from your device (PNG, JPG, WEBP)
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={onAdd}
          />
        </label>
      )}

      {/* Uploaded Preview Thumbnails Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3 pt-1">
          {previews.map((url, i) => (
            <div
              key={i}
              className="relative aspect-square border border-gray-200 rounded-xl overflow-hidden group shadow-xs bg-gray-100 max-w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Item image ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform max-w-full"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs shadow-md hover:bg-red-700 active:scale-95 transition-all"
                title="Remove image"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                #{i + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
