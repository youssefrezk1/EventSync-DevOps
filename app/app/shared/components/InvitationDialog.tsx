"use client";
import { useState, ChangeEvent } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Avatar
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import axios, { AxiosError } from 'axios';

interface InvitationDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function InvitationDialog({ open, onClose }: InvitationDialogProps) {
  const [inviteeName, setInviteeName] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      // Check file type
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setError('Only JPEG, JPG, and PNG images are allowed');
        return;
      }

      setPhotoFile(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!inviteeName.trim()) {
      setError('Please enter the guest name');
      return;
    }

    if (!photoFile) {
      setError('Please upload a photo of the guest ID');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create FormData with both name and photo
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('inviteeName', inviteeName.trim());
      
      const token = localStorage.getItem('token');
      
      // Single API call with both data and file
      await axios.post(
        'http://localhost:4000/api/invitations/create',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccess('Invitation sent successfully! Check your email for the QR code.');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Error creating invitation:', err);
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(
        axiosError.response?.data?.message || 
        'Failed to send invitation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInviteeName('');
    setPhotoFile(null);
    setPhotoPreview('');
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <PersonAddIcon />
        Invite a guest to GUC
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3,pt: 1  }}>
          <TextField
            label="Guest Name"
            fullWidth
            required
            value={inviteeName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInviteeName(e.target.value)}
            placeholder="Enter full name"
            disabled={loading}
            variant="outlined"
            
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom fontWeight={600}>
            Upload Guest ID Photo *
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Please upload a clear photo of the guest's ID (max 5MB, JPEG/PNG only)
          </Typography>
          
          <Button 
            variant="outlined" 
            component="label" 
            fullWidth
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {photoFile ? 'Change Photo' : 'Choose Photo'}
            <input
              type="file"
              hidden
              accept="image/jpeg,image/jpg,image/png"
              onChange={handlePhotoChange}
            />
          </Button>
        </Box>

        {photoPreview && (
          <Box sx={{ 
            textAlign: 'center', 
            mb: 2,
            p: 2,
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            bgcolor: 'grey.50'
          }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Preview:
            </Typography>
            <Box
              component="img"
              src={photoPreview}
              alt="Preview"
              sx={{ 
                maxWidth: '100%', 
                maxHeight: 250,
                borderRadius: 2,
                boxShadow: 2
              }}
            />
          </Box>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> The guest pass will be valid for 7 days from today. 
            A QR code will be sent to your email.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !!success}
          startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
        >
          {loading ? 'Sending...' : 'Send request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}