"use client";
import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        textAlign: "center",
        py: 2,
        borderTop: "1px solid",
        borderColor: "divider",
        backgroundColor: "primary.main",
        color: "text.secondary",
        mt: "auto",
      }}
    >
      <Typography variant="body2">
        © {new Date().getFullYear()} EventSync. All rights reserved.
      </Typography>
    </Box>
  );
}
