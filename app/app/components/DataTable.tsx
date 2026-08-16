"use client";

import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

// Generic column configuration
export interface TableColumn<T> {
  id: string;
  label: React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

// Table props
interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  // 👇 NEW: Allow custom horizontal padding
  horizontalPadding?: number | string;
}

// Reusable chip color helper
export const getChipColor = (
  type: string,
  colorMap?: Record<string, { bg: string; text: string }>
) => {
  const defaultColors: Record<string, { bg: string; text: string }> = {
    Trip: { bg: "#e0f2fe", text: "#0369a1" },
    Workshop: { bg: "#dcfce7", text: "#15803d" },
    Bazaar: { bg: "#fef3c7", text: "#ca8a04" },
    Booth: { bg: "#ede9fe", text: "#7c3aed" },
    Active: { bg: "#dcfce7", text: "#15803d" },
    Inactive: { bg: "#fee2e2", text: "#dc2626" },
    Pending: { bg: "#fef3c7", text: "#ca8a04" },
    Completed: { bg: "#e0f2fe", text: "#0369a1" },
  };

  const colors = colorMap || defaultColors;
  return colors[type] || { bg: "#f3f4f6", text: "#6b7280" };
};

function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  keyExtractor,
  onRowClick,
  horizontalPadding = 3, // 👈 NEW: Default to 3 (24px), matching your current design
}: DataTableProps<T>) {
  const gridTemplate = columns.map((col) => col.width || "1fr").join(" ");

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 12,
          bgcolor: "white",
          borderRadius: 3,
          border: "1px solid #e5e7eb",
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "white",
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Table Header */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: gridTemplate,
          gap: 3,
          px: horizontalPadding, // 👈 CHANGED: Use custom padding
          py: 2.5,
          bgcolor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {columns.map((column) => (
          <Typography
            key={column.id}
            variant="body2"
            fontWeight={600}
            color="#6b7280"
            fontSize="0.8125rem"
            sx={{
              letterSpacing: "0.05em",
              textAlign: column.align || "left",
            }}
          >
            {column.label}
          </Typography>
        ))}
      </Box>

      {/* Table Body */}
      {data.length === 0 ? (
        <Box sx={{ py: 12, textAlign: "center" }}>
          <Typography variant="body1" color="#9ca3af" fontWeight={500}>
            {emptyMessage}
          </Typography>
        </Box>
      ) : (
        <Box>
          {data.map((row, index) => (
            <Box
              key={keyExtractor(row, index)}
              onClick={() => onRowClick?.(row)}
              sx={{
                display: "grid",
                gridTemplateColumns: gridTemplate,
                gap: 3,
                px: horizontalPadding, // 👈 CHANGED: Use custom padding
                py: 3,
                borderBottom: index < data.length - 1 ? "1px solid #f3f4f6" : "none",
                transition: "background-color 0.15s ease",
                cursor: onRowClick ? "pointer" : "default",
                "&:hover": {
                  bgcolor: "#f9fafb",
                },
              }}
            >
              {columns.map((column) => (
                <Box
                  key={column.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      column.align === "center"
                        ? "center"
                        : column.align === "right"
                        ? "flex-end"
                        : "flex-start",
                  }}
                >
                  {column.render ? column.render(row) : null}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default DataTable;