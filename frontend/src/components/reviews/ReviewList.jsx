import React from 'react';
import StarRating from './StarRating';
import { User as UserIcon } from 'lucide-react';

const ReviewList = ({ reviews = [] }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 border border-slate-200/60">
        <p className="font-medium text-sm">No reviews yet for this stay.</p>
        <p className="text-xs text-slate-400 mt-1">
          Be the first guest to share your memorable experience!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reviews.map((rev) => (
        <div
          key={rev._id}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={
                  rev.user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                }
                alt={rev.user?.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <h5 className="font-bold text-sm text-slate-900">
                  {rev.user?.name || 'Verified Guest'}
                </h5>
                <span className="text-xs text-slate-400">
                  {new Date(rev.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <StarRating rating={rev.rating} size="sm" />
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">{rev.comment}</p>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;

