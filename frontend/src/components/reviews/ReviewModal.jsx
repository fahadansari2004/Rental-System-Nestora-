import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import StarRating from './StarRating';
import { reviewService } from '../../services/reviewService';
import { useToast } from '../../hooks/useToast';

const ReviewModal = ({ isOpen, onClose, propertyId, onReviewAdded }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast('Please enter your review comment', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newReview = await reviewService.createReview({
        property: propertyId,
        rating,
        comment,
      });

      showToast('Thank you! Your review has been posted.', 'success');
      if (onReviewAdded) onReviewAdded(newReview);
      onClose();
      setComment('');
      setRating(5);
    } catch (error) {
      showToast(error.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Write a Property Review">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Your Overall Rating
          </label>
          <div className="flex items-center gap-3">
            <StarRating
              rating={rating}
              size="lg"
              interactive={true}
              onChange={setRating}
            />
            <span className="text-sm font-bold text-slate-700">
              {rating} of 5 Stars
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Your Review
          </label>
          <textarea
            rows="4"
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell future travelers about your stay, the host, cleanliness, view, and location..."
            className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Submit Review
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReviewModal;

