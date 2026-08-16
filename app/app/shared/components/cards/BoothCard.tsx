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
  Avatar,
  Divider,
} from "@mui/material";
import {
  LocationOn,
  CalendarToday,
  People,
  Storefront,
  Business,
} from "@mui/icons-material";
import { FavoriteButton } from "../FavoriteButton";
import Link from "next/link";

const boothImage = "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&h=400&fit=crop";

interface BoothCardProps {
  booth: any;
  isFavorited?: boolean;
  onToggleFavorite?: (eventId: string, eventType: string) => void;
  onViewDetails?: (booth: any) => void;
}

const getStatusColor = (status: string) => {
  if (status === "Accept") return "success";
  if (status === "Reject") return "error";
  return "warning";
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function BoothCard({
  booth,
  isFavorited = false,
  onToggleFavorite,
  onViewDetails,
}: BoothCardProps) {
  return (
    <Link href={`/booth/${booth._id}`} style={{ textDecoration: "none" }}>
      <Card
        elevation={0}
        sx={{
          width: 300,
          height: 520,
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
          image={boothImage}
          alt="Booth"
          sx={{ objectFit: "cover" }}
        />

        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Stack direction="row" spacing={0.8} mb={1.5}>
            <Chip
              label="Booth"
              color="primary"
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 20,
              }}
            />
            <Chip
              label={booth.Pending}
              color={getStatusColor(booth.Pending) as any}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 20,
              }}
            />
          </Stack>

          <Box display="flex" alignItems="center" mb={2}>
            <Avatar
              src={booth.VendorID?.logo?.[0]?.url}
              alt={booth.VendorID?.companyName}
              sx={{ width: 40, height: 40, mr: 1.5 }}
            >
              <Business />
            </Avatar>
            <Box sx={{ overflow: "hidden" }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{
                  fontSize: "0.95rem",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {booth.VendorID?.companyName}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "block",
                }}
              >
                {booth.VendorID?.email}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          <Stack spacing={1}>
            <Box display="flex" alignItems="center">
              <LocationOn
                fontSize="small"
                sx={{ mr: 1, color: "primary.main", fontSize: 16 }}
              />
              <Typography variant="caption" fontWeight={500}>
                {booth.Location}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center">
              <Storefront
                fontSize="small"
                sx={{ mr: 1, color: "primary.main", fontSize: 16 }}
              />
              <Typography variant="caption" fontWeight={500}>
                Size: {booth.BoothSize}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center">
              <CalendarToday
                fontSize="small"
                sx={{ mr: 1, color: "primary.main", fontSize: 16 }}
              />
              <Typography variant="caption" fontWeight={500}>
                Setup: {booth.SetupDuration}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center">
              <People
                fontSize="small"
                sx={{ mr: 1, color: "primary.main", fontSize: 16 }}
              />
              <Typography variant="caption" fontWeight={500}>
                Attendees: {booth.Attendees?.length || 0}
              </Typography>
            </Box>
          </Stack>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, display: "block" }}
          >
            Registered: {formatDate(booth.createdAt)}
          </Typography>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0, gap: 1, flexDirection: "column" }}>
          <Box
            sx={{ display: "flex", gap: 1, width: "100%", alignItems: "center" }}
          >
            {onToggleFavorite && (
              <FavoriteButton
                eventId={booth._id}
                eventType="booth"
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
                  onViewDetails(booth);
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
        </CardActions>
      </Card>
    </Link>
  );
}
