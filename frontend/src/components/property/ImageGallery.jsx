import React, { useState } from 'react';
import { Eye, Image as ImageIcon } from 'lucide-react';

const ImageGallery = ({ images = [], title = 'Property Image' }) => {
  const [activeImage, setActiveImage] = useState(images[0] || '');

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[21/9] bg-slate-200 rounded-3xl flex items-center justify-center text-slate-400">
        <ImageIcon className="w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Featured Big Image */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden bg-slate-100 shadow-md">
        <img
          src={activeImage || images[0]}
          alt={title}
          className="w-full h-full object-cover transition-all duration-300"
        />
        <div className="absolute bottom-4 right-4 bg-slate-950/70 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          {images.length} Photos
        </div>
      </div>

      {/* Thumbnails row if multiple images */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(img)}
              className={`aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                (activeImage || images[0]) === img
                  ? 'border-emerald-700 ring-2 ring-emerald-600/30 scale-105'
                  : 'border-transparent opacity-75 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`${title} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;

