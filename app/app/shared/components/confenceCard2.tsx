"use client";

import { Box, Typography, Paper } from "@mui/material";

interface ConferenceCardProps {
  title: string;
  duration: string;
}

export default function ConferenceCard({ title, duration }: ConferenceCardProps) {
  return (
    <Paper
      elevation={6}
      sx={{
        width: 270,
        height: 350,
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        bgcolor: "#3A7BD5",
        boxShadow: "0 8px 25px rgba(0,0,0,0.18)",
      }}
    >
      {/* Background / Sky Section */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          height: 220,
          background: "linear-gradient(180deg, #3A7BD5 0%, #00d2ff 100%)",
        }}
      >
        {/* Abstract shapes */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: 130,
            bgcolor: "#0A1F44",
            clipPath: "ellipse(85% 60% at 50% 100%)",
            opacity: 0.9,
          }}
        ></Box>

        <Box
          sx={{
            position: "absolute",
            bottom: 40,
            left: -30,
            width: 290,
            height: 160,
            bgcolor: "#FFFFFF",
            clipPath: "circle(60% at 60% 80%)",
            filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.15))",
          }}
        ></Box>
      </Box>

      {/* Text Overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 14,
          left: 14,
          color: "white",
          textShadow: "0 2px 4px rgba(0,0,0,0.6)",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
          {duration}
        </Typography>
      </Box>

      {/* Bottom Tag */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: 70,
          background: "linear-gradient(180deg, #3A7BD5 0%, #005c99 100%)",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontWeight: 800,
          fontSize: "1.25rem",
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}
      >
        #Conference
      </Box>
    </Paper>
  );
}
