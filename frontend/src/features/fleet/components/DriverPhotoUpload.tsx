'use client';

import React from 'react';
import { Camera, X } from 'lucide-react';

interface DriverPhotoUploadProps {
  photoDataUrl: string | null;
  onPhotoChange: (dataUrl: string | null) => void;
  onError: (error: string | null) => void;
}

export function DriverPhotoUpload({
  photoDataUrl,
  onPhotoChange,
  onError,
}: DriverPhotoUploadProps) {
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      onError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError('Driver photo must be smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          onPhotoChange(canvas.toDataURL('image/jpeg', 0.85));
          onError(null);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
      <div className="relative w-14 h-14 rounded-full bg-slate-200 border-2 border-emerald-500/30 overflow-hidden flex items-center justify-center shrink-0">
        {photoDataUrl ? (
          <img src={photoDataUrl} alt="Driver" className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-6 h-6 text-slate-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-700">Driver Photo (Cloudinary)</div>
        <div className="text-[11px] text-slate-500 mt-0.5">JPEG, PNG or WebP under 5MB</div>
        <div className="mt-1.5 flex items-center gap-2">
          <label
            htmlFor="driver-photo-input"
            className="cursor-pointer text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-white px-2.5 py-1 rounded-md border border-slate-300 shadow-2xs hover:bg-slate-50 transition-colors inline-block"
          >
            {photoDataUrl ? 'Change Photo' : 'Upload Photo'}
          </label>
          <input
            id="driver-photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoSelect}
            className="hidden"
          />
          {photoDataUrl && (
            <button
              type="button"
              onClick={() => onPhotoChange(null)}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

