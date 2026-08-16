"use client";

import { Card, Typography, Box, Stack, Link } from "@mui/material";
import Image from "next/image";

import RoomIcon from "@mui/icons-material/Room";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import SecurityIcon from "@mui/icons-material/Security";
import WcIcon from "@mui/icons-material/Wc";

type FacilityProps = {
  icon: React.ReactNode;
  label: string;
};

function Facility({ icon, label }: FacilityProps) {
  return (
    <Box display="flex" alignItems="center" gap={1} sx={{ fontSize: 16 }}>
      {icon}
      {label}
    </Box>
  );
}

export default function GUCCard() {
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
          }}
        >
          GUC – German University in Cairo
        </Typography>

        <Typography
          sx={{
            fontSize: 18,
            color: "#555",
            mt: 1.5,
          }}
        >
          Fifth Settlement, New Cairo
        </Typography>

        {/* Open in Maps */}
        <Link
          href="https://maps.app.goo.gl/Zy9ucARbeGHBKWiBA"
          target="_blank"
          underline="hover"
          sx={{
            fontSize: 18,
            display: "inline-flex",
            alignItems: "center",
            mt: 3,
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
          }}
        >
          FACILITIES
        </Typography>

        <Stack
          direction="row"
          spacing={5}
          sx={{ mt: 1, fontSize: 16 }}
        >
          <Facility icon={<WcIcon />} label="Bathrooms" />
          <Facility icon={<RestaurantIcon />} label="Food Services" />
          <Facility icon={<LocalParkingIcon />} label="Parking" />
          <Facility icon={<SecurityIcon />} label="Security" />
        </Stack>
      </Box>

      {/* RIGHT SIDE IMAGE */}
      <Box
        sx={{
          width: 600,
          height: "100%",
          position: "relative",
        }}
      >
        <Image
          src="/images/guc2.jpg"
          alt="GUC Entrance"
          fill
          style={{
            objectFit: "cover",
          }}
        />
      </Box>
    </Card>
  );
}
