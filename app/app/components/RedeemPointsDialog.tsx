"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
  Divider,
  Chip,
} from "@mui/material";
import {
  Stars,
  TrendingUp,
  LocalAtm,
  CheckCircle,
} from "@mui/icons-material";
import { api } from "@/api";

interface RedeemPointsDialogProps {
  open: boolean;
  onClose: () => void;
  currentPoints: number;
  onRedeemSuccess: () => void;
}

interface RedemptionOption {
  points: number;
  dollars: number;
  label: string;
  recommended?: boolean;
}

const redemptionOptions: RedemptionOption[] = [
  { points: 500, dollars: 10, label: "Starter" },
  { points: 1000, dollars: 20, label: "Popular", recommended: true },
  { points: 1500, dollars: 30, label: "Best Value" },
];

export default function RedeemPointsDialog({
  open,
  onClose,
  currentPoints,
  onRedeemSuccess,
}: RedeemPointsDialogProps) {
  const [selectedPoints, setSelectedPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRedeem = async () => {
    if (!selectedPoints) {
      setError("Please select a redemption option");
      setErrorDetail("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setErrorDetail("");

      const { data } = await api.post("/api/payments/redeemPoints", {
        pointsToRedeem: selectedPoints,
      });

      setSuccess(true);
      setTimeout(() => {
        onRedeemSuccess();
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error("Redemption error:", err);
      const errorMessage = err.response?.data?.message || "Failed to redeem points. Please try again.";
      const errorDetailMsg = err.response?.data?.detail || "";
      
      setError(errorMessage);
      setErrorDetail(errorDetailMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPoints(null);
    setError("");
    setErrorDetail("");
    setSuccess(false);
    onClose();
  };

  const getDollarValue = (points: number) => {
    return (points / 500) * 10;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 12px 48px rgba(0, 61, 82, 0.2)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Stars sx={{ fontSize: 28, color: "warning.main" }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Redeem Your Points
          </Typography>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        {/* Current Points Display */}
        <Box
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 2,
            background: "linear-gradient(135deg, #003D52 0%, #005570 100%)",
            color: "white",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              textTransform: "uppercase",
              letterSpacing: 1,
              opacity: 0.9,
              fontWeight: 600,
            }}
          >
            Available Points
          </Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", mt: 0.5 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mr: 1 ,color: "white"}}>
              {currentPoints.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 ,color: "white" }}>
              points
            </Typography>
          </Box>
        </Box>

        {/* Success Message */}
        {success && (
          <Alert
            severity="success"
            icon={<CheckCircle />}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            Points redeemed successfully! Updating your balance...
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: errorDetail ? 1 : 0 }}>
              {error}
            </Typography>
            {errorDetail && (
              <Typography variant="body2" sx={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                {errorDetail}
              </Typography>
            )}
          </Alert>
        )}

        {/* Redemption Options */}
        <Typography
          variant="subtitle2"
          sx={{
            mb: 2,
            color: "text.secondary",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Select Redemption Amount
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {redemptionOptions.map((option) => {
            const canAfford = currentPoints >= option.points;
            const isSelected = selectedPoints === option.points;

            return (
              <Card
                key={option.points}
                sx={{
                  position: "relative",
                  overflow: "visible",
                  border: isSelected
                    ? "2px solid"
                    : "1px solid",
                  borderColor: isSelected ? "primary.main" : "divider",
                  borderRadius: 2,
                  transition: "all 0.2s ease-in-out",
                  opacity: canAfford ? 1 : 0.5,
                  "&:hover": canAfford
                    ? {
                        boxShadow: "0 4px 20px rgba(0, 61, 82, 0.15)",
                        transform: "translateY(-2px)",
                      }
                    : {},
                }}
              >
                {option.recommended && (
                  <Chip
                    label="Recommended"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: -10,
                      right: 16,
                      bgcolor: "warning.main",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                    }}
                  />
                )}
                <CardActionArea
                  onClick={() => canAfford && setSelectedPoints(option.points)}
                  disabled={!canAfford || loading}
                  sx={{ p: 0 }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {option.label}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 0.5 }}>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 800,
                              color: "primary.main",
                            }}
                          >
                            {option.points.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            points
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ textAlign: "right" }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            mb: 0.5,
                          }}
                        >
                          <LocalAtm sx={{ fontSize: 16, color: "success.main" }} />
                          <Typography
                            variant="caption"
                            sx={{
                              color: "success.main",
                              fontWeight: 700,
                              textTransform: "uppercase",
                            }}
                          >
                            Get
                          </Typography>
                        </Box>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 800,
                            color: "success.main",
                          }}
                        >
                          ${option.dollars}
                        </Typography>
                      </Box>
                    </Box>

                    {!canAfford && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mt: 1,
                          color: "error.main",
                          fontWeight: 600,
                        }}
                      >
                        Insufficient points
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>

        {/* Exchange Rate Info */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <TrendingUp sx={{ fontSize: 16, color: "primary.main" }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "primary.main",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Exchange Rate
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            500 points = $10 wallet credit
            <br />
            Points can only be redeemed in multiples of 500
          </Typography>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            px: 3,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleRedeem}
          disabled={!selectedPoints || loading}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 700,
            px: 4,
            boxShadow: "0 4px 14px rgba(0, 61, 82, 0.3)",
          }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            `Redeem ${selectedPoints ? selectedPoints.toLocaleString() : ""} Points`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
