"use client";

import {
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Button,
  Chip,
  Typography,
  Stack,
  Box,
  Divider,
} from "@mui/material";
import {
  CalendarToday,
  AccessTime,
  AttachMoney,
  Event as EventIcon,
} from "@mui/icons-material";
import { FavoriteButton } from "../FavoriteButton";

const conferenceImage = "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop";

interface ConferenceCardProps {
  conference: any;
  isFavorited?: boolean;
  onToggleFavorite?: (eventId: string, eventType: string) => void;
  onViewDetails?: (conference: any) => void;
}

const formatDateRange = (start: string, end: string) => {
  const startDate = new Date(start).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endDate = new Date(end).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return start === end ? startDate : `${startDate} - ${endDate}`;
};

export default function ConferenceCard({
  conference,
  isFavorited = false,
  onToggleFavorite,
  onViewDetails,
}: ConferenceCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        width: 300,
        height: 480,
        mx: 2,
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.25s ease-in-out",
        overflow: "hidden",
        "&:hover": {
          boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
          transform: "translateY(-3px)",
          borderColor: "primary.light",
        },
      }}
    >
      <CardMedia
        component="img"
        height="120"
        image={conferenceImage}
        alt="Conference"
        sx={{ objectFit: "cover" }}
      />

      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Stack direction="row" spacing={0.8} mb={1.5}>
          <Chip
            label="Conference"
            color="primary"
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.7rem",
              height: 20,
            }}
          />
          {conference.sourceOfFunding && (
            <Chip
              label={conference.sourceOfFunding}
              variant="outlined"
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 20,
              }}
            />
          )}
        </Stack>

        <Typography
          variant="subtitle1"
          fontWeight={700}
          mb={1}
          sx={{
            fontSize: "0.95rem",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {conference.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          mb={2}
          sx={{
            fontSize: "0.8rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            lineHeight: 1.4,
            minHeight: "50px",
          }}
        >
          {conference.shortDescription || "No description available."}
        </Typography>

        <Divider sx={{ mb: 1.5 }} />

        <Stack spacing={1}>
          <Box display="flex" alignItems="center">
            <CalendarToday
              fontSize="small"
              sx={{ mr: 1, color: "primary.main", fontSize: 16 }}
            />
            <Typography variant="caption" fontWeight={500}>
              {formatDateRange(
                conference.start,
                conference.endDate || conference.start
              )}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center">
            <AccessTime
              fontSize="small"
              sx={{ mr: 1, color: "primary.main", fontSize: 16 }}
            />
            <Typography variant="caption" fontWeight={500}>
              {conference.time}
            </Typography>
          </Box>

          {conference.requiredBudget && (
            <Box display="flex" alignItems="center">
              <AttachMoney
                fontSize="small"
                sx={{ mr: 1, color: "primary.main", fontSize: 16 }}
              />
              <Typography variant="caption" fontWeight={500}>
                ${conference.requiredBudget}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0, gap: 1, flexDirection: "column" }}>
        <Box
          sx={{ display: "flex", gap: 1, width: "100%", alignItems: "center" }}
        >
          {onToggleFavorite && (
            <FavoriteButton
              eventId={conference._id}
              eventType="conference"
              isFavorited={isFavorited}
              onToggle={onToggleFavorite}
              size="small"
            />
          )}
          {onViewDetails && (
            <Button
              size="small"
              variant="outlined"
              fullWidth
              onClick={() => onViewDetails(conference)}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                py: 0.5,
                fontSize: "0.8rem",
              }}
            >
              View Details
            </Button>
          )}
        </Box>
      </CardActions>
    </Card>
  );
}
