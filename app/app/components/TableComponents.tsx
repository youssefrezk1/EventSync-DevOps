"use client";

import React from "react";
import { Typography, Chip, Box } from "@mui/material";
import { getChipColor } from "./DataTable";

// Text Cell
export const TextCell: React.FC<{
  text: string | number;
  fontWeight?: number;
  color?: string;
  fontSize?: string;
}> = ({ text, fontWeight = 500, color = "#111827", fontSize = "0.875rem" }) => (
  <Typography variant="body2" fontWeight={fontWeight} color={color} fontSize={fontSize}>
    {text}
  </Typography>
);

// Secondary Text Cell
export const SecondaryTextCell: React.FC<{ text: string | number }> = ({ text }) => (
  <Typography variant="body2" color="#6b7280" fontSize="0.875rem">
    {text}
  </Typography>
);

// Currency Cell
export const CurrencyCell: React.FC<{ amount: number; color?: string }> = ({
  amount,
  color = "#059669",
}) => (
  <Typography variant="body2" fontWeight={600} color={color} fontSize="0.875rem">
    ${amount.toLocaleString()}
  </Typography>
);

// Number Cell
export const NumberCell: React.FC<{ value: number; color?: string }> = ({
  value,
  color = "#2563eb",
}) => (
  <Typography variant="body2" fontWeight={600} color={color} fontSize="0.875rem">
    {value.toLocaleString()}
  </Typography>
);

// Status Chip
export const StatusChip: React.FC<{
  label: string;
  colorMap?: Record<string, { bg: string; text: string }>;
}> = ({ label, colorMap }) => {
  const colors = getChipColor(label, colorMap);
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: colors.bg,
        color: colors.text,
        fontWeight: 600,
        fontSize: "0.75rem",
        height: "26px",
        borderRadius: "6px",
        "& .MuiChip-label": {
          px: 1.5,
        },
      }}
    />
  );
};

// Date Range Cell
export const DateRangeCell: React.FC<{
  start?: string | Date;
  end?: string | Date;
}> = ({ start, end }) => {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  if (!start) return <SecondaryTextCell text="-" />;

  const startStr = formatDate(start);
  if (!end) return <SecondaryTextCell text={startStr} />;

  const endStr = formatDate(end);
  return <SecondaryTextCell text={`${startStr} → ${endStr}`} />;
};

// Badge Cell
export const BadgeCell: React.FC<{
  count: number;
  color?: string;
  bgColor?: string;
}> = ({ count, color = "#2563eb", bgColor = "#eff6ff" }) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      px: 2,
      py: 0.5,
      borderRadius: 2,
      bgcolor: bgColor,
    }}
  >
    <Typography variant="body2" fontWeight={600} color={color} fontSize="0.875rem">
      {count.toLocaleString()}
    </Typography>
  </Box>
);
//