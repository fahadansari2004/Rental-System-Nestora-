import api from './api';

export const reviewService = {
  async createReview(reviewData) {
    const res = await api.post('/reviews', reviewData);
    return res.data;
  },

  async getPropertyReviews(propertyId) {
    const res = await api.get(`/reviews/property/${propertyId}`);
    return res.data;
  },

  async deleteReview(id) {
    const res = await api.delete(`/reviews/${id}`);
    return res.data;
  },
};

