"use client";

import { Box, Typography, Paper } from "@mui/material";

interface BazaarStampProps {
  title: string;
  duration: string;
}

export default function BazaarStamp({ title, duration }: BazaarStampProps) {
  return (
    <Paper
      elevation={6}
      sx={{
        width: 270,
        height: 350,
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        bgcolor: "#F46A33",
        boxShadow: "0 8px 25px rgba(0,0,0,0.18)",
      }}
    >
      {/* Background / Sky Section */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          height: 220,
          background: "linear-gradient(180deg, #F46A33 0%, #EA622D 100%)",
        }}
      >
        {/* Smoother black mountain */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: 130,
            bgcolor: "#0B0B0B",
            clipPath: "ellipse(80% 55% at 50% 100%)",
            opacity: 0.95,
          }}
        ></Box>

        {/* Refined white dune */}
        <Box
          sx={{
            position: "absolute",
            bottom: 40,
            left: -40,
            width: 290,
            height: 160,
            bgcolor: "white",
            clipPath: "ellipse(65% 45% at 55% 85%)",
            filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.15))",
          }}
        ></Box>

        {/* Stylized bars (cleaner and aligned) */}
        <Box
          sx={{
            position: "absolute",
            bottom: 20,
            right: 18,
            display: "flex",
            gap: "3px",
          }}
        >
          {[40, 55, 30, 70, 50].map((h, i) => (
            <Box
              key={i}
              sx={{
                width: 5,
                height: h,
                bgcolor: "#F46A33",
                borderRadius: 2,
              }}
            />
          ))}
        </Box>
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

      {/* Improved Bottom Tag */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: 70,
          background: "linear-gradient(180deg, #F46A33 0%, #D45726 100%)",
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
        #Bazaar
      </Box>
    </Paper>
  );
}
