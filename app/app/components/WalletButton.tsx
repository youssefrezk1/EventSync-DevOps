"use client";

import { useState, useEffect } from "react";
import {
  IconButton,
  Popover,
  Box,
  Typography,
  CircularProgress,
  Divider,
  Button,
} from "@mui/material";
import { AccountBalanceWallet, TrendingUp, Info, Stars, Redeem } from "@mui/icons-material";
import { api } from "@/api";
import RedeemPointsDialog from "./RedeemPointsDialog";

export default function WalletButton() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);

  const fetchWalletBalance = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/api/payments/getmywallet");
      setWalletBalance(data.walletBalance || 0);
      setPoints(data.points || 0);
    } catch (err: unknown) {
      console.error("Failed to fetch wallet balance:", err);
      setError("Failed to load wallet");
      setWalletBalance(0);
      setPoints(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchWalletBalance();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "wallet-popover" : undefined;

  return (
    <>
      <IconButton
        aria-describedby={id}
        onClick={handleClick}
        sx={{
          color: "primary.main",
          "&:hover": {
            backgroundColor: "rgba(0, 61, 82, 0.08)",
          },
        }}
        title="View wallet balance"
      >
        <AccountBalanceWallet sx={{ fontSize: 24 }} />
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 420,
            maxHeight: 600,
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 61, 82, 0.15)",
            overflow: "hidden",
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2.5, borderBottom: "1px solid #F0F2F5" }}>
          <Typography variant="h5" sx={{ color: "text.primary", mb: 1 }}>
            Account Balance
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Available Credits
          </Typography>
        </Box>

        {/* Balance Section */}
        <Box sx={{ p: 2.5 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={32} />
            </Box>
          ) : error ? (
            <Typography
              variant="body2"
              color="error"
              sx={{
                py: 2,
                px: 2,
                bgcolor: "rgba(239, 68, 68, 0.08)",
                borderRadius: 2,
                textAlign: "center",
                fontWeight: 500,
              }}
            >
              {error}
            </Typography>
          ) : (
            <Box>
              {/* Wallet Balance */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    mb: 1,
                  }}
                >
                  Wallet Balance
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontSize: "2.8rem",
                    color: "primary.main",
                    letterSpacing: -1,
                    lineHeight: 1,
                    fontWeight: 800,
                  }}
                >
                  ${walletBalance.toFixed(2)}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mt: 1,
                  }}
                >
                  <TrendingUp sx={{ fontSize: 14, color: "success.main" }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.7rem",
                      color: "success.main",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Ready to use
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Points Section */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    mb: 1,
                  }}
                >
                  Reward Points
                </Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                  <Stars sx={{ fontSize: 24, color: "warning.main" }} />
                  <Typography
                    variant="h4"
                    sx={{
                      fontSize: "2rem",
                      color: "warning.main",
                      letterSpacing: -0.5,
                      fontWeight: 800,
                    }}
                  >
                    {points.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.85rem",
                    }}
                  >
                    points
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 0.5,
                    color: "text.secondary",
                    fontSize: "0.7rem",
                  }}
                >
                  Earn 150 points per $100 spent
                </Typography>
              </Box>

              {/* Redeem Button */}
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  setRedeemDialogOpen(true);
                  handleClose();
                }}
                disabled={points < 500}
                startIcon={<Redeem />}
                sx={{
                  mt: 2,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  borderRadius: 2,
                  boxShadow: "0 4px 14px rgba(0, 61, 82, 0.3)",
                  "&:disabled": {
                    bgcolor: "action.disabledBackground",
                  },
                }}
              >
                Redeem Points
              </Button>
              {points < 500 && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1,
                    textAlign: "center",
                    color: "text.secondary",
                    fontSize: "0.7rem",
                  }}
                >
                  Minimum 500 points required
                </Typography>
              )}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 0, opacity: 0.5 }} />

        {/* Info Section */}
        {!loading && !error && (
          <Box sx={{ p: 2.5 }}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: "background.default",
                border: "1px solid #F0F2F5",
              }}
            >
              <Info sx={{ fontSize: 18, color: "primary.main", flexShrink: 0, mt: 0.25 }} />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "primary.main",
                    textTransform: "uppercase",
                    display: "block",
                    mb: 0.5,
                    letterSpacing: 0.5,
                  }}
                >
                  How it works
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.8rem",
                    color: "text.secondary",
                    lineHeight: 1.5,
                    display: "block",
                  }}
                >
                  Your balance increases through refunds or points redemption. Use your available balance to book trips or register in workshops.
                </Typography>
              </Box>
            </Box>

            <Typography
              variant="caption"
              sx={{
                fontSize: "0.7rem",
                color: "text.secondary",
                display: "block",
                mt: 2,
                textAlign: "center",
                fontWeight: 500,
              }}
            >
              Last updated just now
            </Typography>
          </Box>
        )}
      </Popover>

      {/* Redemption Dialog */}
      <RedeemPointsDialog
        open={redeemDialogOpen}
        onClose={() => setRedeemDialogOpen(false)}
        currentPoints={points}
        onRedeemSuccess={() => {
          fetchWalletBalance();
        }}
      />
    </>
  );
}  