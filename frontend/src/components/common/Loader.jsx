import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Loader2 className={`${sizes[size] || sizes.md} animate-spin text-emerald-600`} />
    </div>
  );
};

export const CardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm animate-pulse">
    <div className="aspect-[4/3] bg-slate-200" />
    <div className="p-5 space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-12" />
      </div>
      <div className="h-5 bg-slate-200 rounded w-4/5" />
      <div className="h-4 bg-slate-200 rounded w-1/2" />
      <div className="pt-3 flex justify-between items-center border-t border-slate-100">
        <div className="h-5 bg-slate-200 rounded w-20" />
        <div className="h-8 bg-slate-200 rounded-lg w-24" />
      </div>
    </div>
  </div>
);

export default Spinner;
