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
  LocationOn,
  CalendarToday,
  AccessTime,
  School,
} from "@mui/icons-material";
import { FavoriteButton } from "../FavoriteButton";
import Link from "next/link";

const workshopImage =
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop";

interface WorkshopCardProps {
  workshop: any;
  isFavorited?: boolean;
  onToggleFavorite?: (eventId: string, eventType: string) => void;
  onViewDetails?: (workshop: any) => void;
  onRegister?: (workshop: any) => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function WorkshopCard({
  workshop,
  isFavorited = false,
  onToggleFavorite,
  onViewDetails,
  onRegister,
}: WorkshopCardProps) {
  return (
    <Link href={`/workshop/${workshop._id}`} style={{ textDecoration: "none" }}>
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
          image={workshopImage}
          alt="Workshop"
          sx={{ objectFit: "cover" }}
        />

        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Stack direction="row" spacing={0.8} mb={1.5}>
            <Chip
              label="Workshop"
              color="primary"
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 20,
              }}
            />
            <Chip
              label={workshop.facultyResponsible}
              variant="outlined"
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 20,
              }}
            />
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
            {workshop.name}
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
            {workshop.shortDescription || "No description available."}
          </Typography>

          <Divider sx={{ mb: 1.5 }} />

          <Stack spacing={1}>
            <Box display="flex" alignItems="center">
              <CalendarToday
                fontSize="small"
                sx={{ mr: 1, color: "primary.main", fontSize: 16 }}
              />
              <Typography variant="caption" fontWeight={500}>
                {formatDate(workshop.start)}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center">
              <AccessTime
                fontSize="small"
                sx={{ mr: 1, color: "primary.main", fontSize: 16 }}
              />
              <Typography variant="caption" fontWeight={500}>
                {workshop.time}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center">
              <LocationOn
                fontSize="small"
                sx={{ mr: 1, color: "primary.main", fontSize: 16 }}
              />
              <Typography variant="caption" fontWeight={500}>
                {workshop.location}
              </Typography>
            </Box>
          </Stack>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0, gap: 1, flexDirection: "column" }}>
          <Box sx={{ display: "flex", gap: 1, width: "100%", alignItems: "center" }}>
            {onToggleFavorite && (
              <FavoriteButton
                eventId={workshop._id}
                eventType="workshop"
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
                onClick={(e) => {
                  e.preventDefault();
                  onViewDetails(workshop);
                }}
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
          {onRegister && (
            <Button
              size="small"
              variant="contained"
              fullWidth
              onClick={(e) => {
                e.preventDefault();
                onRegister(workshop);
              }}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                py: 0.5,
                fontSize: "0.8rem",
              }}
            >
              Register
            </Button>
          )}
        </CardActions>
      </Card>
    </Link>
  );
}
