"use client";

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { addToFavorites, removeFromFavorites, checkFavorite } from "@/lib/api/favorites";
import { useFavoritesContext } from "@/contexts/FavoritesContext";

interface FavoriteButtonProps {
  eventId: string;
  eventType: "trip" | "workshop" | "bazaar" | "conference" | "booth";
}

export default function FavoriteButton({ eventId, eventType }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Get context functions
  const { incrementCount, decrementCount } = useFavoritesContext();

  const checkIfFavorited = useCallback(async () => {
    try {
      setLoading(true);
      const response = await checkFavorite(eventId);
      setIsFavorited(response.isFavorited);
    } catch (error) {
      console.error("Failed to check favorite status:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    checkIfFavorited();
  }, [checkIfFavorited]);

  const handleToggleFavorite = async () => {
    try {
      setActionLoading(true);
      
      if (isFavorited) {
        await removeFromFavorites(eventId);
        setIsFavorited(false);
        decrementCount(); // ✅ Update global count
      } else {
        await addToFavorites({ eventId, eventType });
        setIsFavorited(true);
        incrementCount(); // ✅ Update global count
      }
    } catch (error: unknown) {
      console.error("Failed to toggle favorite:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "message" in error.response.data &&
        typeof error.response.data.message === "string"
          ? error.response.data.message
          : "Failed to update favorites";

      alert(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Get dynamic text based on event type
  const getEventText = () => {
    const texts = {
      workshop: {
        notSaved: "Interested in this workshop? Save it to easily find it later.",
        saved: "This workshop is saved to your favorites, click again to remove it."
      },
      trip: {
        notSaved: "Planning to join this trip? Add it to your favorites for quick access.",
        saved: "This trip is saved to your favorites, click again to remove it."
      },
      bazaar: {
        notSaved: "Loving this bazaar? Save it to your favorites and never miss it.",
        saved: "This bazaar is saved to your favorites, click again to remove it."
      },
      conference: {
        notSaved: "Don't want to miss this conference? Add it to your favorites.",
        saved: "This conference is saved to your favorites,  click again to remove it."
      },
      booth: {
        notSaved: "Interested in this booth? Save it for easy access later.",
        saved: "This booth is saved to your favorites, click again to remove it."
      }
    };

    return isFavorited ? texts[eventType].saved : texts[eventType].notSaved;
  };

  if (loading) {
    return (
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: 3,
          p: 3,
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 88,
        }}
      >
        <CircularProgress size={24} sx={{ color: "#003d52" }} />
      </Box>
    );
  }

  return (
    <Box
      onClick={handleToggleFavorite}
      sx={{
        bgcolor: "white",
        borderRadius: 3,
        p: 3,
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: 2,
        cursor: "pointer",
        minHeight: 88,
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "#003d52",
          boxShadow: "0 2px 8px rgba(0, 61, 82, 0.1)",
        },
      }}
    >
      {actionLoading ? (
        <CircularProgress size={32} sx={{ color: "#003d52" }} />
      ) : (
        <>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: isFavorited ? "rgba(0, 61, 82, 0.12)" : "rgba(0, 61, 82, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
          >
            {isFavorited ? (
              <FavoriteIcon sx={{ color: "#003d52", fontSize: 24 }} />
            ) : (
              <FavoriteBorderIcon sx={{ color: "#003d52", fontSize: 24 }} />
            )}
          </Box>

          <Box flex={1}>
            <Typography 
              sx={{ 
                fontSize: 14, 
                fontWeight: 600,
                color: "#0F1724",
                mb: 0.5,
                lineHeight: 1.3,
              }}
            >
              {isFavorited ? "Saved to Favorites" : "Add to Favorites"}
            </Typography>
            <Typography 
              sx={{ 
                fontSize: 13,
                color: "#64748b",
                lineHeight: 1.4,
              }}
            >
              {getEventText()}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}