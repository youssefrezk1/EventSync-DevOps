import { useState, useEffect } from 'react';
import { api } from '@/api';

export interface User {
  id: string;
  role: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Event {
  _id: string;
  name: string;
  start: string;
  end?: string;
  endDate?: string;
  time: string;
  location: string;
  shortDescription: string;
  eventType: 'trip' | 'workshop' | 'bazaar' | 'conference' | 'booth';
  // Trip specific fields
  price?: number;
  capacity?: number;
  registrationDeadline?: string;
  // Workshop specific fields
  facultyResponsible?: string;
  professorsParticipating?: string[];
  requiredBudget?: number;
  fundingSource?: string;
  
  extraRequiredResources?: string;
  ProfCreator?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  // Conference specific fields
  fullAgenda?: string;
  conferenceWebsiteLink?: string;
  sourceOfFunding?: string;
  status?: string;
  fullagenda?: string;
  isArchived?: boolean;
  // Bazaar specific fields
 
}

export interface SearchFilters {
  search: string;
  location: string;
  date: string;
  type: string;
  faculty:string
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  professorName?: string;
}

export const useUser = (): User | null => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUserFromToken = () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({
            id: payload.userId || payload.id || payload._id,
            role: payload.role,
            email: payload.email,
            firstName: payload.firstName,
            lastName: payload.lastName
          });
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    };

    getUserFromToken();
  }, []);

  return user;
};

export const useEvents = (eventType?: string) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async (filters: Partial<SearchFilters> = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.location) params.append('location', filters.location);
      if (filters.date) params.append('date', filters.date);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.faculty) params.append('faculty', filters.faculty);
      if (filters.professorName) params.append('professorName', filters.professorName);

      let endpoint = '/api/events';
      if (eventType && eventType !== 'all') {
        endpoint = `/api/events/type/${eventType}`;
      }

      const response = await api.get(`${endpoint}?${params.toString()}`);
      console.log('Fetched events:', response.data);
      setEvents(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };
   const deleteTrip = async (tripId: string) => {
    try {
      await api.delete(`/api/trips/${tripId}`);
      // remove deleted trip from local state immediately
      setEvents((prev) => prev.filter((e) => e._id !== tripId));
      return { ok: true };
    } catch (err: any) {
      // Don't set the global error state here — the caller should decide how to display
      // delete-specific errors so the events list remains visible.
      const message = err.response?.data?.message || 'Failed to delete trip';
      return { ok: false, error: message };
    }
  };
  
  const deleteWorkshop = async (workshopId: string) => {
    try {
      await api.delete(`/api/workshops/${workshopId}`);
      setEvents((prev) => prev.filter((e) => e._id !== workshopId));
      return { ok: true };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete workshop';
      return { ok: false, error: message };
    }
  };

  const deleteBazaar = async (bazaarId: string) => {
    try {
      await api.delete(`/api/bazaars/${bazaarId}`);
      setEvents((prev) => prev.filter((e) => e._id !== bazaarId));
      return { ok: true };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete bazaar';
      return { ok: false, error: message };
    }
  };

  const deleteConference = async (conferenceId: string) => {
    try {
      await api.delete(`/api/conferences/${conferenceId}`);
      setEvents((prev) => prev.filter((e) => e._id !== conferenceId));
      return { ok: true };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete conference';
      return { ok: false, error: message };
    }
  };

  return {
    events,
    loading,
    error,
    fetchEvents,
    deleteTrip,
    deleteWorkshop,
    deleteBazaar,
    deleteConference
  };
};

export const useBazaarVendors = (bazaarId: string) => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/events/bazaars/${bazaarId}/vendors`);
      setVendors(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bazaarId) {
      fetchVendors();
    }
  }, [bazaarId]);

  return {
    vendors,
    loading,
    error,
    refetch: fetchVendors
  };
};
