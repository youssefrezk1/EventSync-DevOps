"use client";

import { Suspense } from "react";

import React, { useEffect, useState } from "react";
import BasicLayout from "@/components/layouts/basicLayout2";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Divider,
  Chip,
  Paper,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  alpha,
} from "@mui/material";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ShieldIcon from "@mui/icons-material/Shield";
import StarIcon from "@mui/icons-material/Star";
import { CreditCard, AccountBalanceWallet } from "@mui/icons-material";


import { api } from "@/api";
import { useSearchParams } from "next/navigation";
import HomeIcon from "@mui/icons-material/Home";
import FavoriteIcon from "@mui/icons-material/Favorite";
import EventIcon from "@mui/icons-material/Event";
import EventAvailable from "@mui/icons-material/EventAvailable";
import SportsFootball from "@mui/icons-material/SportsFootball";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import LocalOffer from "@mui/icons-material/LocalOffer";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AlertSnackbar from "@/components/AlertSnackbar";

type Item = {
  _id: string;
  name: string;
  Price: number;
  description?: string;
  Photo?: any[];
  category?: string;
  Availability?: boolean;
};

type CartType = {
  _id: string;
  items: Array<{ foodItem: Item; quantity: number }>;
  Restraunt?: string;
} | null;

function decodeTokenId(): string | null {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      )
    );
    return json.id || json._id || json.sub || null;
  } catch {
    return null;
  }
}

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/student" },
  { text: "Events", icon: <EventIcon />, href: "/dashboards/student/events" },
  { text: "Registered events", icon: <EventAvailable />, href: "/dashboards/student/registeredEvents" },
  { text: "Courts", icon: <SportsFootball />, href: "/dashboards/student/courts" },
    {
      text: "Tournaments",
      icon: <FitnessCenterIcon />,
      href: "/dashboards/student/tournaments",
    },
  { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/student/gym" },
  { text: "Loyalty Program", icon: <LocalOffer />, href: "/dashboards/student/loyaltyProgram" },
  { text: "Restaurants", icon: <RestaurantIcon />, href: "/dashboards/student/restaurants" },
];

function MenuPageContent() {
  const search = useSearchParams();
  const restrauntId = search.get("restrauntId");

  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartType>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [pickupLocationState, setPickupLocationState] = useState<string>('UC');
  const [phoneState, setPhoneState] = useState<string>('');
  const [paymentMethodState, setPaymentMethodState] = useState<'card' | 'wallet'>('card');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info" = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    if (restrauntId) {
      fetchMenu();
      // Check and clear cart if it belongs to a different restaurant, then fetch cart
      (async () => {
        await checkAndClearCartIfDifferentRestaurant();
        fetchCart();
      })();
    }
  }, [restrauntId]);

  useEffect(() => {
    // Initial cart fetch (will be cleared if restaurant doesn't match)
    if (restrauntId) {
      fetchCart();
    }
    fetchWalletBalance();
  }, []);

  async function checkAndClearCartIfDifferentRestaurant() {
    if (!restrauntId) return;
    try {
      const studentId = decodeTokenId();
      if (!studentId) return;
      
      const res = await api.get(`/cart/${studentId}`);
      const existingCart = res.data?.cart;
      
      if (existingCart && existingCart.items && existingCart.items.length > 0) {
        // Check if cart belongs to a different restaurant
        const cartRestaurantId = existingCart.Restraunt?.toString() || existingCart.Restraunt?._id?.toString();
        if (cartRestaurantId && cartRestaurantId !== restrauntId) {
          // Cart belongs to a different restaurant, clear it
          await api.post('/cart/clear', { studentId });
          setCart(null);
        } else if (!cartRestaurantId) {
          // Cart has no restaurant set, clear it to start fresh
          await api.post('/cart/clear', { studentId });
          setCart(null);
        }
      }
    } catch (err) {
      console.error('Error checking cart:', err);
    }
  }

  // Attempt to clear cart on page unload unless payment is in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const inProgress = sessionStorage.getItem('paymentInProgress');
      if (inProgress) return;
      try {
        const token = localStorage.getItem('token');
        const url = `${api.defaults.baseURL}/cart/clear`;
        const payload = JSON.stringify({});
        // Use fetch with keepalive so Authorization header can be included
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: payload,
          keepalive: true,
        }).catch(() => { });
      } catch (err) {
        // swallow
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  async function fetchMenu() {
    try {
      const res = await api.get(`/restraunt/menu/${restrauntId}`);
      const menu = res.data?.menu;
      const data = menu?.FoodItems || [];
      setItems(data);

      const q: Record<string, number> = {};
      data.forEach((i: any) => (q[i._id] = 1));
      setQuantities(q);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchCart() {
    try {
      const studentId = decodeTokenId();
      if (!studentId) return;
      const res = await api.get(`/cart/${studentId}`);
      setCart(res.data?.cart);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchWalletBalance() {
    try {
      const { data } = await api.get('/api/payments/getmywallet');
      setWalletBalance(data.walletBalance || 0);
    } catch (err: any) {
      console.error('Failed to fetch wallet balance:', err);
      setWalletBalance(0);
    }
  }

  async function handleAdd(itemId: string) {
    try {
      const studentId = decodeTokenId();
      const qty = quantities[itemId] || 1;
      const item = items.find(i => i._id === itemId);
      await api.post("/cart/add", { studentId, foodItemId: itemId, quantity: qty, restrauntId: restrauntId });
      fetchCart();
      showSnackbar(`✅ ${item?.name || 'Item'} added to cart!`, "success");
    } catch (err: any) {
      console.error(err);
      showSnackbar(err?.response?.data?.error || "Failed to add item to cart", "error");
    }
  }

  async function updateCartQuantity(foodItemId: string, quantity: number) {
    try {
      const studentId = decodeTokenId();
      await api.post("/cart/update", { studentId, foodItemId, quantity });
      fetchCart();
      if (quantity === 0) {
        showSnackbar("Item removed from cart", "info");
      }
    } catch (err: any) {
      console.error(err);
      showSnackbar(err?.response?.data?.error || "Failed to update cart", "error");
    }
  }

  async function removeFromCart(foodItemId: string) {
    try {
      const studentId = decodeTokenId();
      const item = cart?.items?.find(it => it.foodItem._id === foodItemId);
      await api.post("/cart/remove", { studentId, foodItemId });
      fetchCart();
      showSnackbar(`✅ ${item?.foodItem?.name || 'Item'} removed from cart`, "success");
    } catch (err: any) {
      console.error(err);
      showSnackbar(err?.response?.data?.error || "Failed to remove item", "error");
    }
  }

  async function clearCart() {
    try {
      const studentId = decodeTokenId();
      await api.post("/cart/clear", { studentId });
      fetchCart();
      showSnackbar("Cart cleared successfully", "info");
    } catch (err: any) {
      console.error(err);
      showSnackbar(err?.response?.data?.error || "Failed to clear cart", "error");
    }
  }

  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[];

  const filtered = items.filter((it) => {
    // Filter out unavailable items
    if (!it.Availability) return false;
    if (searchText && !(`${it.name} ${it.description || ""} ${it.category || ""}`.toLowerCase().includes(searchText.toLowerCase()))) return false;
    if (categoryFilter !== "all" && it.category !== categoryFilter) return false;
    if (minPrice !== "" && it.Price < Number(minPrice)) return false;
    if (maxPrice !== "" && it.Price > Number(maxPrice)) return false;
    return true;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "price") {
      comparison = a.Price - b.Price;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const subtotal = cart?.items?.reduce((sum, item) => sum + (item.foodItem.Price * item.quantity), 0) || 0;
  const serviceFee = subtotal * 0.08;
  const total = subtotal + serviceFee;

  return (
    <BasicLayout menuItems={menuItems}>
      <Box sx={{ bgcolor: "#f5f7fa", minHeight: "100vh", pb: 6 }}>
        {/* MAIN CONTAINER */}
        <Box sx={{ maxWidth: 1600, mx: "auto", px: 3, pt: 3 }}>

          {/* Hero Section - Full Width */}
          <Box
            sx={{
              position: "relative",
              borderRadius: 4,
              overflow: "hidden",
              mb: 4,
              backgroundColor: "rgba(249, 247, 243, 1)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "stretch",
                height: 380,
              }}
            >
              {/* Left Content Section */}
              <Box
                sx={{
                  flex: "0 0 45%",
                  px: 6,
                  py: 5,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Box display={"flex"} gap={0.5}>
                  <Box>
                    <Typography
                      variant="h1"
                      fontWeight={800}
                      color="primary.main"
                      sx={{
                        mb: 2,
                        letterSpacing: "-0.01em",
                        lineHeight: 1.2,
                      }}
                    >
                      Delicious Meals
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="body1"
                  color="primary.main"
                  sx={{
                    mb: 4,
                    fontWeight: 400,
                    lineHeight: 1.7,
                    maxWidth: 440,
                  }}
                >
                  Explore our freshly prepared menu featuring a variety of cuisines.
                  Order your favorites and enjoy convenient campus pickup.
                </Typography>

                {/* Stats Row */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 4,
                    mb: 4,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h3"
                      fontWeight={700}
                      color="primary.main"
                      sx={{ lineHeight: 1, mb: 0.5 }}
                    >
                      {filtered.length}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="primary.main"
                      sx={{ fontSize: "0.875rem" }}
                    >
                      Menu Items
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="h3"
                      fontWeight={700}
                      color="primary.main"
                      sx={{ lineHeight: 1, mb: 0.5 }}
                    >
                      {categories.length}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="primary.main"
                      sx={{ fontSize: "0.875rem" }}
                    >
                      Categories
                    </Typography>
                  </Box>
                </Box>

                {/* Delivery Info Chips */}
               
              </Box>

              {/* Right Image Grid Section */}
              <Box
                sx={{
                  flex: "0 0 55%",
                  display: "flex",
                  gap: 2,
                  p: 3,
                  alignItems: "stretch",
                }}
              >
                {/* Left Column - Large Image */}
                <Box
                  sx={{
                    flex: "0 0 48%",
                    position: "relative",
                    borderRadius: 3,
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  }}
                >
                  <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop"
                    alt="Main Dishes"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      p: 2.5,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                    }}
                  >
                    <Typography variant="subtitle1" color="white" fontWeight={600}>
                      Main Dishes
                    </Typography>
                  </Box>
                </Box>

                {/* Right Column - 3 Images Stacked */}
                <Box
                  sx={{
                    flex: "0 0 48%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {/* Appetizers */}
                  <Box
                    sx={{
                      flex: 1,
                      position: "relative",
                      borderRadius: 3,
                      overflow: "hidden",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    }}
                  >
                    <Box
                      component="img"
                      src="https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&auto=format&fit=crop"
                      alt="Appetizers"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1.5,
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                      }}
                    >
                      <Typography variant="body2" color="white" fontWeight={600}>
                        Appetizers
                      </Typography>
                    </Box>
                  </Box>

                  {/* Drinks */}
                  <Box
                    sx={{
                      flex: 1,
                      position: "relative",
                      borderRadius: 3,
                      overflow: "hidden",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    }}
                  >
                    <Box
                      component="img"
                      src="https://images.unsplash.com/photo-1546173159-315724a31696?w=800&auto=format&fit=crop"
                      alt="Beverages"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1.5,
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                      }}
                    >
                      <Typography variant="body2" color="white" fontWeight={600}>
                        Beverages
                      </Typography>
                    </Box>
                  </Box>

                  {/* Desserts */}
                  <Box
                    sx={{
                      flex: 1,
                      position: "relative",
                      borderRadius: 3,
                      overflow: "hidden",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    }}
                  >
                    <Box
                      component="img"
                      src="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop"
                      alt="Desserts"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1.5,
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                      }}
                    >
                      <Typography variant="body2" color="white" fontWeight={600}>
                        Desserts
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* 3-Column Content Layout */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>

            {/* 1. FILTERS SIDEBAR */}
            <Paper
              sx={{
                width: 280,
                flexShrink: 0,
                borderRadius: 2,
                backgroundColor: "background.paper",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                position: "sticky",
                top: 24,
                height: "calc(100vh - 48px)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              {/* Header */}
              <Box sx={{ p: 3, borderBottom: "1px solid #ddd", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "white" }}>
                <Typography variant="h6" fontWeight={600}>
                  Filters
                </Typography>
                <Button
                  size="small"
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    setCategoryFilter("all");
                    setSearchText("");
                    setSortBy("name");
                    setSortOrder("asc");
                  }}
                  sx={{ textTransform: "none", fontSize: "0.85rem" }}
                >
                  Clear All
                </Button>
              </Box>

              {/* Scrollable Content */}
              <Box sx={{ p: 3, flex: 1, overflowY: "auto" }}>
                {/* Search */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} mb={2}>
                    Search
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search meals..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Categories */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} mb={2}>
                    Categories
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {["all", ...categories].map((cat) => (
                      <Button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        sx={{
                          textTransform: "none",
                          justifyContent: "flex-start",
                          fontSize: "0.875rem",
                          py: 0.75,
                          px: 2,
                          borderRadius: 1,
                          backgroundColor: categoryFilter === cat ? alpha("#1976d2", 0.08) : "transparent",
                          color: categoryFilter === cat ? "primary.main" : "text.primary",
                          fontWeight: categoryFilter === cat ? 600 : 400,
                          "&:hover": {
                            backgroundColor: alpha("#1976d2", 0.12),
                          }
                        }}
                      >
                        {cat}
                      </Button>
                    ))}
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Price Range */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} mb={2}>
                    Price Range
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    <TextField
                      label="Min"
                      type="number"
                      size="small"
                      fullWidth
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      sx={{ "& .MuiInputBase-root": { height: "40px" } }}
                    />
                    <TextField
                      label="Max"
                      type="number"
                      size="small"
                      fullWidth
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      sx={{ "& .MuiInputBase-root": { height: "40px" } }}
                    />
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Sort By */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} mb={2}>
                    Sort By
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="name">Name</MenuItem>
                      <MenuItem value="price">Price</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Sort Order */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} mb={2}>
                    Order
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="asc">Ascending</MenuItem>
                      <MenuItem value="desc">Descending</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Paper>

            {/* 2. MAIN MENU CONTENT (Center) */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                <ShoppingCartIcon /> Our Menu
                {filtered.length > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    ({filtered.length} items)
                  </Typography>
                )}
              </Typography>

              {/* ROW LIST */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {filtered.map((i) => (
                  <Box
                    key={i._id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      bgcolor: "white",
                      borderRadius: 2,
                      p: 2.5,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                      border: "1px solid #e0e0e0",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    {/* IMAGE */}
                    <Box
                      sx={{
                        width: 120,
                        height: 100,
                        borderRadius: 2,
                        overflow: "hidden",
                        mr: 3,
                        flexShrink: 0,
                        border: "1px solid #eee",
                      }}
                    >
                      {i.Photo?.[0]?.url ? (
                        <img
                          src={i.Photo[0].url}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Box sx={{ width: "100%", height: "100%", bgcolor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Typography color="text.secondary">No Image</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* NAME + DESC */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                        <Typography fontWeight={700} fontSize="18px">{i.name}</Typography>
                        {i.category && (
                          <Chip
                            label={i.category}
                            size="small"
                            sx={{
                              backgroundColor: "#e3f2fd",
                              color: "primary.main",
                              fontWeight: 500
                            }}
                          />
                        )}
                      </Box>
                      <Typography sx={{ color: "text.secondary", mb: 1, fontSize: "14px" }}>
                        {i.description || "Delicious meal made with fresh ingredients."}
                      </Typography>
                    </Box>

                    {/* PRICE */}
                    <Box sx={{ minWidth: 120, textAlign: "center", mr: 3 }}>
                      <Typography fontWeight={700} fontSize="20px" color="primary.main">
                        EGP {i.Price.toFixed(2)}
                      </Typography>
                    </Box>

                    {/* ADD BUTTON */}
                    <Button
                      variant="contained"
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                        textTransform: "none",
                        fontSize: "14px",
                      }}
                      color="primary"
                      onClick={() => handleAdd(i._id)}
                      startIcon={<AddIcon />}
                    >
                      Add to Cart
                    </Button>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* 3. CART SIDEBAR (Right) */}
            <Box
              sx={{
                width: 360,
                flexShrink: 0,
                bgcolor: "#f8f9fa",
                border: "1px solid #ddd",
                borderRadius: 2,
                position: "sticky",
                top: 24,
                height: "calc(100vh - 48px)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              {/* Cart Header */}
              <Box sx={{ p: 3, bgcolor: "white", borderBottom: "1px solid #ddd", zIndex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ShoppingCartIcon /> Your Cart
                  </Typography>
                  <Chip
                    label={`${totalItems} items`}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Items in your cart are saved for later
                </Typography>
              </Box>

              {/* Cart Content - Scrollable inside the card */}
              <Box sx={{ p: 3, overflowY: "auto", flex: 1 }}>
                {cart?.items?.length ? (
                  <>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                      {cart.items.map((it) => (
                        <Box
                          key={it.foodItem._id}
                          sx={{
                            bgcolor: "white",
                            borderRadius: 2,
                            p: 2.5,
                            border: "1px solid #e0e0e0",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          }}
                        >
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 80, height: 80, borderRadius: 1.5, overflow: "hidden", flexShrink: 0 }}>
                              {it.foodItem.Photo?.[0]?.url ? (
                                <img
                                  src={it.foodItem.Photo[0].url}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <Box sx={{ width: "100%", height: "100%", bgcolor: "#f5f5f5" }} />
                              )}
                            </Box>

                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <Typography fontWeight={600} fontSize="15px" sx={{ mb: 0.5 }}>
                                  {it.foodItem.name}
                                </Typography>
                                <Typography fontWeight={700} color="primary.main">
                                  EGP {(it.foodItem.Price * it.quantity).toFixed(2)}
                                </Typography>
                              </Box>

                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                {it.foodItem.description?.substring(0, 60)}...
                              </Typography>

                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                {/* Quantity Controls */}
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Box sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    border: "1px solid #ddd",
                                    borderRadius: 2,
                                    overflow: "hidden"
                                  }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => updateCartQuantity(it.foodItem._id, Math.max(1, it.quantity - 1))}
                                      sx={{
                                        borderRadius: 0,
                                        borderRight: "1px solid #ddd",
                                        "&:hover": { backgroundColor: "#f5f5f5" }
                                      }}
                                    >
                                      <RemoveIcon fontSize="small" />
                                    </IconButton>
                                    <Box sx={{ px: 2, minWidth: 40, textAlign: "center" }}>
                                      <Typography>{it.quantity}</Typography>
                                    </Box>
                                    <IconButton
                                      size="small"
                                      onClick={() => updateCartQuantity(it.foodItem._id, it.quantity + 1)}
                                      sx={{
                                        borderRadius: 0,
                                        borderLeft: "1px solid #ddd",
                                        "&:hover": { backgroundColor: "#f5f5f5" }
                                      }}
                                    >
                                      <AddIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>

                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeFromCart(it.foodItem._id)}
                                  sx={{
                                    border: "1px solid #ffcdd2",
                                    "&:hover": { backgroundColor: "#ffebee" }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>

                    {/* Order Summary */}
                    <Box sx={{ mt: 4, bgcolor: "white", borderRadius: 2, p: 3, border: "1px solid #e0e0e0" }}>
                      <Typography fontWeight={700} fontSize="16px" sx={{ mb: 2 }}>
                        Order Summary
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Typography color="text.secondary">Subtotal ({totalItems} items)</Typography>
                          <Typography fontWeight={600}>EGP {subtotal.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Typography color="text.secondary">Service Fee (8%)</Typography>
                          <Typography fontWeight={600}>EGP {serviceFee.toFixed(2)}</Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                        <Typography fontWeight={700} fontSize="18px">Total</Typography>
                        <Typography fontWeight={700} fontSize="18px" color="primary.main">
                          EGP {total.toFixed(2)}
                        </Typography>
                      </Box>

                      <Button
                        fullWidth
                        variant="contained"
                        sx={{
                          mb: 2,
                          py: 1.5,
                          borderRadius: 2,
                          fontWeight: 600,
                          fontSize: "15px",
                          textTransform: "none",
                        }}
                        color="primary"
                        onClick={() => setCheckoutOpen(true)}
                      >
                        Proceed to Checkout
                      </Button>

                      {/* Checkout Dialog */}
                      <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} fullWidth maxWidth="sm">
                        <DialogTitle>Checkout</DialogTitle>
                        <DialogContent>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <FormControl fullWidth>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>Pickup Location</Typography>
                              <Select value={pickupLocationState} onChange={(e) => setPickupLocationState(e.target.value)}>
                                <MenuItem value="UC">UC</MenuItem>
                                <MenuItem value="UD">UD</MenuItem>
                                <MenuItem value="UB">UB</MenuItem>
                                <MenuItem value="N">N</MenuItem>
                                <MenuItem value="Restaurant">Pick from Restaurant</MenuItem>
                              </Select>
                            </FormControl>

                            <TextField
                              label="Phone Number"
                              value={phoneState}
                              onChange={(e) => setPhoneState(e.target.value)}
                              fullWidth
                              size="small"
                            />

                            <Box>
                              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Payment Method</Typography>

                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {/* Wallet Option */}
                                <Box
                                  sx={{
                                    p: 1.5,
                                    border: paymentMethodState === 'wallet' ? '2px solid' : '1px solid',
                                    borderColor: paymentMethodState === 'wallet' ? 'primary.main' : 'divider',
                                    borderRadius: 1.5,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    bgcolor: paymentMethodState === 'wallet' ? alpha('#1976d2', 0.04) : 'transparent',
                                    '&:hover': {
                                      borderColor: 'primary.main',
                                      bgcolor: alpha('#1976d2', 0.04),
                                    }
                                  }}
                                  onClick={() => setPaymentMethodState('wallet')}
                                >
                                  <FormControlLabel
                                    control={
                                      <Radio
                                        checked={paymentMethodState === 'wallet'}
                                        onChange={() => setPaymentMethodState('wallet')}
                                        sx={{ p: 1 }}
                                      />
                                    }
                                    label={
                                      <Box sx={{ ml: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <AccountBalanceWallet sx={{ fontSize: 20, color: 'primary.main' }} />
                                          <Box>
                                            <Typography fontWeight={600} sx={{ fontSize: 14 }}>Wallet</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                                              Balance: EGP {walletBalance.toFixed(2)}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </Box>
                                    }
                                    sx={{ width: '100%', ml: 0, my: 0 }}
                                  />
                                </Box>

                                {/* Card Option */}
                                <Box
                                  sx={{
                                    p: 1.5,
                                    border: paymentMethodState === 'card' ? '2px solid' : '1px solid',
                                    borderColor: paymentMethodState === 'card' ? 'primary.main' : 'divider',
                                    borderRadius: 1.5,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    bgcolor: paymentMethodState === 'card' ? alpha('#1976d2', 0.04) : 'transparent',
                                    '&:hover': {
                                      borderColor: 'primary.main',
                                      bgcolor: alpha('#1976d2', 0.04),
                                    }
                                  }}
                                  onClick={() => setPaymentMethodState('card')}
                                >
                                  <FormControlLabel
                                    control={
                                      <Radio
                                        checked={paymentMethodState === 'card'}
                                        onChange={() => setPaymentMethodState('card')}
                                        sx={{ p: 1 }}
                                      />
                                    }
                                    label={
                                      <Box sx={{ ml: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <CreditCard sx={{ fontSize: 20, color: 'primary.main' }} />
                                          <Typography fontWeight={600} sx={{ fontSize: 14 }}>Credit Card</Typography>
                                        </Box>
                                      </Box>
                                    }
                                    sx={{ width: '100%', ml: 0, my: 0 }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 3 }}>
                          <Button onClick={() => setCheckoutOpen(false)} color="inherit" sx={{ textTransform: "none" }}>Cancel</Button>
                          <Button
                            variant="contained"
                            onClick={async () => {
                              if (!cart?._id) return;
                              if (!phoneState) { 
                                showSnackbar('Please enter a phone number', "warning");
                                return; 
                              }

                              if (paymentMethodState === 'wallet' && walletBalance < total) {
                                showSnackbar(
                                  `Insufficient wallet balance. You need EGP ${total.toFixed(2)} but have EGP ${walletBalance.toFixed(2)}`,
                                  "error"
                                );
                                return;
                              }

                              setProcessingPayment(true);
                              try {
                                const res = await api.post(`/api/payments/payforcart/${cart._id}`, {
                                  paymentMethod: paymentMethodState,
                                  phone: phoneState,
                                  pickupLocation: pickupLocationState,
                                });

                                if (paymentMethodState === 'wallet') {
                                  showSnackbar('✅ Payment successful using wallet!', "success");
                                  setTimeout(() => {
                                    window.location.reload();
                                  }, 1500);
                                } else if (res.data.url) {
                                  window.location.href = res.data.url;
                                }
                              } catch (err: any) {
                                console.error(err);
                                const errorMessage = err?.response?.data?.message || 'Payment failed. Please try again.';
                                showSnackbar(errorMessage, "error");
                              } finally {
                                setProcessingPayment(false);
                              }
                            }}
                            disabled={processingPayment}
                          >
                            {processingPayment ? <CircularProgress size={24} /> : 'Pay Now'}
                          </Button>
                        </DialogActions>
                      </Dialog>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", color: "text.secondary" }}>
                    <ShoppingCartIcon sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
                    <Typography variant="h6" fontWeight={600}>Your cart is empty</Typography>
                    <Typography variant="body2">Start adding some delicious meals!</Typography>
                  </Box>
                )}
              </Box>
            </Box>

          </Box>
        </Box>
      </Box>
      
      {/* Snackbar for notifications */}
      <AlertSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </BasicLayout>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={null}>
      <MenuPageContent />
    </Suspense>
  );
}
