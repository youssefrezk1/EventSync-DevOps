import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useState, useEffect } from 'react';

interface FavoriteButtonProps {
  eventId: string;
  eventType: string;
  isFavorited: boolean;
  onToggle: (eventId: string, eventType: string, currentStatus: boolean) => Promise<boolean> | void;
  size?: 'small' | 'medium' | 'large';
}

export const FavoriteButton = ({ 
  eventId, 
  eventType, 
  isFavorited: initialFavorited, 
  onToggle,
  size = 'medium'
}: FavoriteButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [favorited, setFavorited] = useState(initialFavorited);

  // Update local state when prop changes
  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click if button is in a card
    e.preventDefault();
    
    console.log('FavoriteButton clicked:', { eventId, eventType, favorited });
    
    setLoading(true);
    const result = await Promise.resolve(
      onToggle(eventId, eventType, favorited)
    );
    const success = result === undefined ? true : result;
    console.log('Toggle result:', success);
    if (success) {
      setFavorited(!favorited);
    }
    setLoading(false);
  };

  return (
    <Tooltip title={favorited ? 'Remove from favorites' : 'Add to favorites'}>
      <IconButton
        onClick={handleClick}
        disabled={loading}
        size={size}
        sx={{
          color: favorited ? 'error.main' : 'action.active',
          '&:hover': {
            backgroundColor: favorited ? 'error.lighter' : 'action.hover',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {loading ? (
          <CircularProgress size={size === 'small' ? 16 : size === 'large' ? 28 : 24} />
        ) : favorited ? (
          <Favorite fontSize={size} />
        ) : (
          <FavoriteBorder fontSize={size} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default FavoriteButton;
