// LocationCard.tsx
"use client";
import { useState } from "react";
import { Card, Typography, Box, Stack, IconButton, Link } from "@mui/material";
import Image from "next/image";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import RoomIcon from "@mui/icons-material/Room";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import SecurityIcon from "@mui/icons-material/Security";
import WcIcon from "@mui/icons-material/Wc";

interface LocationCardProps {
  location: string;
}

const LOCATION_DATA = {
  "Green Area": {
    title: "The Green Area",
    subtitle: "The main Bazaar Hub",
    mapsUrl: "https://maps.app.goo.gl/8SP6PmuxthywNV4B9",
    images: [
      "/images/greenArea.jpg",
      "/images/admission4.jpg",
      "/images/admission5.jpg",
      "/images/admission6.jpg",
    ],
  },
  "Admission": {
    title: "Admission Area — Gate 5",
    subtitle: "Main admission and student support area",
    mapsUrl: "https://maps.app.goo.gl/zCT8WJH3XyoeEsu76",
    images: [
      "/images/admission.jpg",
      "/images/admission4.jpg",
      "/images/admission5.jpg",
      "/images/admission6.jpg",
    ],
  },
};

function Facility({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Box 
      display="flex" 
      alignItems="center" 
      gap={1} 
      sx={{ 
        fontSize: 16,
        color: "#333",
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

export default function LocationCard({ location }: LocationCardProps) {
  const [index, setIndex] = useState(0);

  // Get location data or return null if location is not supported
  const locationData = LOCATION_DATA[location as keyof typeof LOCATION_DATA];
  
  if (!locationData) {
    return null; // Don't render anything if location is not found
  }

  const { title, subtitle, mapsUrl, images } = locationData;

  const next = () => setIndex((prev) => (prev + 1) % images.length);
  const prev = () => setIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <Card
      sx={{
        display: "flex",
        justifyContent: "space-between",
        borderRadius: "24px",
        overflow: "hidden",
        bgcolor: "#ffffff",
        height: 360,
        width: "100%",
        maxWidth: 1200,
        boxShadow: "0px 4px 20px rgba(0,0,0,0.08)",
      }}
    >
      {/* LEFT SIDE */}
      <Box
        sx={{
          flex: 1,
          p: 5,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography
          sx={{
            fontSize: 32,
            fontWeight: 600,
            lineHeight: 1.2,
            color: "#1a1a1a",
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            fontSize: 18,
            color: "#555",
            mt: 1.5,
          }}
        >
          {subtitle}
        </Typography>

        {/* Open in Maps */}
        <Link
          href={mapsUrl}
          target="_blank"
          underline="hover"
          sx={{
            fontSize: 18,
            display: "inline-flex",
            alignItems: "center",
            mt: 3,
            width: "fit-content",
          }}
        >
          Open In Maps <RoomIcon sx={{ ml: 0.5, fontSize: 20 }} />
        </Link>

        {/* Facilities */}
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 600,
            mt: 5,
            mb: 1,
            color: "#1a1a1a",
          }}
        >
          FACILITIES
        </Typography>

        <Stack direction="row" spacing={5} sx={{ mt: 1, fontSize: 16 }}>
          <Facility icon={<WcIcon sx={{ color: "#666" }} />} label="Bathrooms" />
          <Facility icon={<RestaurantIcon sx={{ color: "#666" }} />} label="Food Services" />
          <Facility icon={<LocalParkingIcon sx={{ color: "#666" }} />} label="Parking" />
          <Facility icon={<SecurityIcon sx={{ color: "#666" }} />} label="Security" />
        </Stack>
      </Box>

      {/* RIGHT SIDE SLIDER */}
      <Box
        sx={{
          width: 600,
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* SLIDES CONTAINER */}
        <Box
          sx={{
            display: "flex",
            transition: "transform 0.5s ease-in-out",
            transform: `translateX(-${index * 100}%)`,
            height: "100%",
          }}
        >
          {images.map((src, i) => (
            <Box
              key={i}
              sx={{
                minWidth: "100%",
                height: "100%",
                position: "relative",
              }}
            >
              <Image
                src={src}
                alt={`${title} ${i + 1}`}
                fill
                style={{ objectFit: "cover" }}
              />
            </Box>
          ))}
        </Box>

        {/* NAVIGATION ARROWS */}
        <IconButton
          onClick={prev}
          sx={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            bgcolor: "rgba(255,255,255,0.95)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            "&:hover": { 
              bgcolor: "white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            },
            width: 40,
            height: 40,
          }}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton
          onClick={next}
          sx={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            bgcolor: "rgba(255,255,255,0.95)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            "&:hover": { 
              bgcolor: "white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            },
            width: 40,
            height: 40,
          }}
        >
          <ArrowForwardIosIcon sx={{ fontSize: 18 }} />
        </IconButton>

        {/* SLIDE INDICATORS */}
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 1,
          }}
        >
          {images.map((_, i) => (
            <Box
              key={i}
              onClick={() => setIndex(i)}
              sx={{
                width: i === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: i === index ? "white" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: "white",
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Card>
  );
}