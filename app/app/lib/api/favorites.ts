import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export interface AddToFavoritesPayload {
  eventId: string;
  eventType: 'trip' | 'workshop' | 'bazaar' | 'conference' | 'booth';
}

// Add to favorites
export const addToFavorites = async (payload: AddToFavoritesPayload) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/favorites`,
    payload,
    getAuthHeaders()
  );
  return response.data;
};

// Remove from favorites
export const removeFromFavorites = async (eventId: string) => {
  const response = await axios.delete(
    `${API_BASE_URL}/api/favorites/${eventId}`,
    getAuthHeaders()
  );
  return response.data;
};

// Check if favorited
export const checkFavorite = async (eventId: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/api/favorites/check/${eventId}`,
    getAuthHeaders()
  );
  return response.data;
};

// Get all favorites
export const getFavorites = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/api/favorites`,
    getAuthHeaders()
  );
  return response.data;
};