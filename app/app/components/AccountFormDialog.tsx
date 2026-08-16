"use client";

import { useState, ChangeEvent } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box
} from "@mui/material";

interface AccountFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: { name: string; email: string; password: string }) => void;
  role: "admin" | "eventOffice";
}

export default function AccountFormDialog({
  open, onClose, onSubmit, role
}: AccountFormDialogProps) {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({ name: "", email: "", password: "" });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Create {role === "admin" ? "Admin" : "Event Office"} Account
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Name" name="name" value={formData.name} onChange={handleChange} />
          <TextField label="Email" name="email" value={formData.email} onChange={handleChange} />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>Create</Button>
      </DialogActions>
    </Dialog>
  );
}
