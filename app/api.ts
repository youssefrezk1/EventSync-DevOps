// src/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: '', // backend URL
});

// Automatically attach token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Favorites API methods
export const favoritesApi = {
  // Get all favorites
  getFavorites: async () => {
    const response = await api.get('/api/favorites');
    return response.data;
  },

  // Add to favorites
  addToFavorites: async (eventId: string, eventType: string) => {
    const response = await api.post('/api/favorites', { eventId, eventType });
    return response.data;
  },

  // Remove from favorites
  removeFromFavorites: async (eventId: string) => {
    const response = await api.delete(`/api/favorites/${eventId}`);
    return response.data;
  },

  // Check if favorited
  checkFavorite: async (eventId: string) => {
    const response = await api.get(`/api/favorites/check/${eventId}`);
    return response.data;
  },
};
