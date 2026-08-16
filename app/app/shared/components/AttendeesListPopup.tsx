import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Box,
  Avatar,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";

interface Attendee {
  name: string;
  email: string;
}

interface PhotoID {
  public_id: string;
  url: string;
}

interface AttendeesListPopupProps {
  open: boolean;
  onClose: () => void;
  attendees: Attendee[];
  photoIDs: PhotoID[];
}

const AttendeesListPopup: React.FC<AttendeesListPopupProps> = ({
  open,
  onClose,
  attendees,
  photoIDs,
}) => {
  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${name}_photo.jpg`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: "16px",
          width: "550px", // Increased width to accommodate wider email
          maxHeight: "80vh",
          overflow: "hidden",
        },
      }}
      BackdropProps={{
        sx: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight={600}>
          Attendees List
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {attendees.map((attendee, index) => (
          <Card
            key={index}
            variant="outlined"
            sx={{
              display: "flex",
              alignItems: "center",
              p: 1.5,
              borderRadius: 2,
              boxShadow: 0,
              "&:hover": { boxShadow: 2 },
              position: "relative",
            }}
          >
            {/* Avatar / Photo */}
            <Box sx={{ position: "relative", mr: 2, flexShrink: 0 }}>
              {photoIDs[index]?.url ? (
                <CardMedia
                  component="img"
                  image={photoIDs[index].url}
                  alt={attendee.name}
                  sx={{
                    width: 150,
                    height: 120,
                    borderRadius: 1,
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Avatar sx={{ width: 120, height: 120 }}>
                  {attendee.name.charAt(0).toUpperCase()}
                </Avatar>
              )}
            </Box>

            {/* Info - Increased width */}
            <CardContent sx={{ 
              flex: 1, 
              p: "0 !important", 
              minWidth: 0, // Allows text wrapping
              width: "100%", // Takes full available width
            }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                Name: {attendee.name}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  wordBreak: "break-all", // Breaks long emails
                  overflowWrap: "break-word", // Ensures proper word breaking
                  maxWidth: "100%", // Uses full available width
                  display: "block",
                }}
              >
                Email: {attendee.email}
              </Typography>
            </CardContent>

            {/* Download Button - Top Right */}
            {photoIDs[index]?.url && (
              <Tooltip title="Download Photo" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleDownload(photoIDs[index].url, attendee.name)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    "&:hover": { backgroundColor: "#f0f0f0" },
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Card>
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default AttendeesListPopup;