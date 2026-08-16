"use client";
import { Avatar, Box, Typography, Dialog, DialogContent, IconButton } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import CloseIcon from '@mui/icons-material/Close';

interface VendorLogo {
  public_id: string;
  url: string;
}

interface Vendor {
  companyName: string;
  logo: VendorLogo[];
}

export default function VendorCarousel({
  registeredVendors,
}: {
  registeredVendors: Vendor[];
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const scrollVariants = {
    animate: {
      x: isPaused ? 0 : ["0%", "-50%"],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop" as const,
          duration: 30,
          ease: "linear" as const,
        },
      },
    },
  };

  const handleVendorClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
  };

  const handleClose = () => {
    setSelectedVendor(null);
  };

  return (
    <>
      <Box
        sx={{
          overflow: "hidden",
          py: 6,
          backgroundColor: "#f9fafb",
          position: "relative",
        }}
      >
        <motion.div
          style={{
            display: "flex",
            gap: "2rem",
            width: "max-content",
            paddingLeft: "2rem",
            paddingRight: "2rem",
          }}
          variants={scrollVariants}
          animate="animate"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {registeredVendors.concat(registeredVendors).map((vendor, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Box
                onClick={() => handleVendorClick(vendor)}
                sx={{
                  minWidth: 130,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  p: 2,
                  borderRadius: "20px",
                  backgroundColor: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  border: "2px solid transparent",
                  "&:hover": {
                    boxShadow: "0 12px 28px rgba(59, 130, 246, 0.15), 0 4px 12px rgba(0,0,0,0.08)",
                    borderColor: "#3b82f6",
                  },
                }}
              >
                <Avatar
                  src={vendor.logo?.[0]?.url}
                  alt={vendor.companyName}
                  sx={{
                    width: 90,
                    height: 90,
                    borderRadius: "16px",
                    backgroundColor: "#f3f4f6",
                    border: "3px solid #fff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    transition: "all 0.3s ease",
                  }}
                />
              </Box>
            </motion.div>
          ))}
        </motion.div>

        {/* Gradient overlays for smooth edge effect */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "120px",
            height: "100%",
            background: "linear-gradient(to right, #f9fafb 0%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "120px",
            height: "100%",
            background: "linear-gradient(to left, #f9fafb 0%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      </Box>

      {/* Dialog for vendor details */}
      <Dialog
        open={Boolean(selectedVendor)}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            m: 2,
          },
        }}
        sx={{
          "& .MuiDialog-container": {
            alignItems: "center",
            justifyContent: "center",
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            position: "relative",
            background: "linear-gradient(135deg, #3e4c87ff 0%, #363a71ff 100%)",
          }}
        >
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              color: "white",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              zIndex: 2,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.3)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 5,
              px: 3,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <Avatar
                src={selectedVendor?.logo?.[0]?.url}
                alt={selectedVendor?.companyName}
                sx={{
                  width: 140,
                  height: 140,
                  borderRadius: "24px",
                  backgroundColor: "white",
                  border: "6px solid white",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                  mb: 3,
                }}
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: "1.5rem",
                  color: "white",
                  textAlign: "center",
                  letterSpacing: "-0.02em",
                  textShadow: "0 2px 10px rgba(0,0,0,0.2)",
                }}
              >
                {selectedVendor?.companyName}
              </Typography>
            </motion.div>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}