// app/components/AlertSnackbar.tsx
"use client";

import { Snackbar, Alert } from "@mui/material";

interface AlertSnackbarProps {
  open: boolean;
  message: string;
  severity?: "success" | "error" | "warning" | "info";
  onClose: () => void;
}

export default function AlertSnackbar({
  open,
  message,
  severity = "info",
  onClose,
}: AlertSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        sx={{ width: "100%", fontWeight: 500 }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
