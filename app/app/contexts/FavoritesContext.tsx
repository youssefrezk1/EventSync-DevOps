"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getFavorites } from "@/lib/api/favorites";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  role?: string;
}

interface FavoritesContextType {
  favoritesCount: number;
  refreshFavorites: () => Promise<void>;
  incrementCount: () => void;
  decrementCount: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Set mounted to true after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch favorites on mount (only for students, only on client)
  useEffect(() => {
    if (mounted) {
      fetchFavoritesCount();
    }
  }, [mounted]);

  const fetchFavoritesCount = async () => {
    try {
      // Only run on client
      if (typeof window === "undefined") return;
      
      // Check if user is a student before fetching favorites
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const decoded = jwtDecode<DecodedToken>(token);
        // Only fetch favorites for students
        if (decoded.role !== "student") {
          return;
        }
      } catch {
        return;
      }

      const favorites = await getFavorites();
      // Filter out deleted/null items
      const validFavorites = favorites.filter((event: any) => event && event._id);
      setFavoritesCount(validFavorites.length);
    } catch (error) {
      // Silently ignore errors for non-student roles
    }
  };

  const refreshFavorites = async () => {
    await fetchFavoritesCount();
  };

  const incrementCount = () => {
    setFavoritesCount((prev) => prev + 1);
  };

  const decrementCount = () => {
    setFavoritesCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <FavoritesContext.Provider
      value={{
        favoritesCount,
        refreshFavorites,
        incrementCount,
        decrementCount,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavoritesContext must be used within a FavoritesProvider");
  }
  return context;
}