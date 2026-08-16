import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Alert,
  IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { api } from "../../../api";

interface RegistrationDialogProps {
  open: boolean;
  onClose: () => void;
  trip: any;
  onRegistrationSuccess: (registrationId: string) => void;
}

export default function RegistrationDialog({
  open,
  onClose,
  trip,
  onRegistrationSuccess
}: RegistrationDialogProps) {
  const [formData, setFormData] = useState({ Name: '', Email: '', StudentID: '' });
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!trip) return;
    setSubmitting(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await api.post(`/api/trips/${trip._id}/register`, formData);
      const data = res.data;

      setStatusMsg({ type: 'success', text: 'Registered successfully! Proceeding to payment...' });
      const regId = data.registration._id || data._id;
      
      // Wait a moment to show success message
      setTimeout(() => {
        onRegistrationSuccess(regId);
        onClose();
      }, 1000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ Name: '', Email: '', StudentID: '' });
    setStatusMsg({ type: '', text: '' });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Register for {trip?.name}
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Name"
            value={formData.Name}
            onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Email"
            type="email"
            value={formData.Email}
            onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Student ID"
            value={formData.StudentID}
            onChange={(e) => setFormData({ ...formData, StudentID: e.target.value })}
            fullWidth
          />
          {statusMsg.text && <Alert severity={statusMsg.type as any}>{statusMsg.text}</Alert>}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Register'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}