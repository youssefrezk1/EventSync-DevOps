import React from "react";
import { Box, Typography, Button } from "@mui/material";

interface SelectableMapProps {
  location: string;
  setLocation: (loc: string) => void;
}

const SelectableMap: React.FC<SelectableMapProps> = ({
  location,
  setLocation,
}) => {
  // Define your 4 booth locations with labels and coordinates (percentages)
  const locations = [
    { label: "A", x: 31, y: 30.5 },
    { label: "B", x: 31, y: 69.5 },
    { label: "E", x: 60, y: 95 },
    { label: "C", x: 40.5, y: 95 },
    { label: "D", x: 50.6, y: 95 },
     { label: "F", x: 69, y: 69.5 },
    { label: "G", x: 69, y: 30.5 },
   
  ];

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      <img
        src="/images/platform.jpeg"
        alt="Map"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          borderRadius: 8,
        }}
      />

      {locations.map((loc) => (
        <Button
          key={loc.label}
          variant={location === loc.label ? "contained" : "outlined"}
          color="primary"
          size="small"
          onClick={() => setLocation(loc.label)}
          sx={{
            position: "absolute",
            left: `${loc.x}%`,
            top: `${loc.y}%`,
            transform: "translate(-50%, -50%)",
            borderRadius: 2,
            px: 2,
            py: 1,
            fontWeight: 600,
            pointerEvents: "auto",
          }}
        >
          {loc.label}
        </Button>
      ))}
    </Box>
  );
};

export default SelectableMap;
