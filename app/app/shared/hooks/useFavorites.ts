import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = '';

export interface FavoriteEvent {
  _id: string;
  name: string;
  eventType: 'trip' | 'workshop' | 'bazaar' | 'conference' | 'booth';
  start: string;
  end?: string;
  endDate?: string;
  location: string;
  shortDescription: string;
  price?: number;
  capacity?: number;
  time?: string;
  // Workshop fields
  ProfCreator?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  // Booth fields
  VendorID?: {
    companyName: string;
    email: string;
    logo?: string;
  };
  // Other fields as needed
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all favorites
  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, skipping favorites fetch');
        setFavorites([]);
        return;
      }
      
      console.log('Fetching favorites...');
      const response = await fetch(`${API_BASE_URL}/api/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Favorites response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Favorites fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch favorites: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched favorites:', data);
      setFavorites(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
      console.error('Error fetching favorites:', err);
      setFavorites([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Add to favorites
  const addToFavorites = async (eventId: string, eventType: string) => {
    console.log('Adding to favorites:', { eventId, eventType });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId, eventType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Add to favorites error:', errorData);
        throw new Error(errorData.message || 'Failed to add to favorites');
      }

      const result = await response.json();
      console.log('Successfully added to favorites:', result);
      await fetchFavorites(); // Refresh the list
      return true;
    } catch (err) {
      console.error('Error in addToFavorites:', err);
      setError(err instanceof Error ? err.message : 'Failed to add to favorites');
      return false;
    }
  };

  // Remove from favorites
  const removeFromFavorites = async (eventId: string) => {
    console.log('Removing from favorites:', eventId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/favorites/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Remove from favorites error:', errorData);
        throw new Error('Failed to remove from favorites');
      }

      const result = await response.json();
      console.log('Successfully removed from favorites:', result);
      await fetchFavorites(); // Refresh the list
      return true;
    } catch (err) {
      console.error('Error in removeFromFavorites:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove from favorites');
      return false;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (eventId: string, eventType: string, isFavorited: boolean) => {
    console.log('Toggling favorite:', { eventId, eventType, isFavorited });
    if (isFavorited) {
      return await removeFromFavorites(eventId);
    } else {
      return await addToFavorites(eventId, eventType);
    }
  };

  // Check if an event is favorited
  const isFavorited = (eventId: string) => {
    const result = favorites.some(fav => fav._id === eventId);
    console.log(`isFavorited(${eventId}):`, result, 'Total favorites:', favorites.length);
    return result;
  };

  // Load favorites on mount
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorited,
    refetch: fetchFavorites,
  };
};

export default useFavorites;
