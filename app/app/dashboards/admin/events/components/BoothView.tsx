"use client";

import { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Grid,
  Stack,
  Divider
} from "@mui/material";
import { 
  Search, 
  Business, 
  LocationOn,
  CalendarToday,
  People,
  Storefront,
  Close,
  Event as EventIcon,
  Timelapse
} from "@mui/icons-material";
import { api } from '@/api';
import BoothDetailsDialog from '../../../../shared/components/BoothDetailsDialog';

interface Booth {
  _id: string;
  VendorID: {
    _id: string;
    companyName: string;
    email: string;
    logo: Array<{ public_id: string; url: string }>;
    status: string;
  };
  Attendees: Array<{
    name: string;
    email: string;
  }>;
  SetupDuration: string;
  Location: string;
  BoothSize: string;
  PhotoIDs: Array<{
    public_id: string;
    url: string;
  }>;
  Pending: string;
  createdAt: string;
  updatedAt: string;
}

interface SearchFilters {
  search: string;
  location: string;
  boothSize: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function BoothView() {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayedBoothsCount, setDisplayedBoothsCount] = useState(6);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    location: '',
    boothSize: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const fetchBooths = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.location) params.append('location', filters.location);
      if (filters.boothSize) params.append('boothSize', filters.boothSize);
      if (filters.status) params.append('status', filters.status);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await api.get(`/api/booths?${params.toString()}`);
      setBooths(response.data);
      setDisplayedBoothsCount(6);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch booths');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooths();
  }, [filters]);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleLoadMore = () => {
    setDisplayedBoothsCount((prev) => prev + 6);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleViewDetails = (booth: Booth) => {
    setSelectedBooth(booth);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedBooth(null);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Pending': 'warning',
      'Accept': 'success',
      'Reject': 'error'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  // Delete dialog state
  const [selectedBoothToDelete, setSelectedBoothToDelete] = useState<Booth | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const displayedBooths = booths.slice(0, displayedBoothsCount);
  const hasMoreBooths = displayedBoothsCount < booths.length;

  const boothTypeColor = "#ace6d7ff";

  return (
    <Box sx={{ display: "flex", gap: 3 }}>
      {/* Left Sidebar - Filters */}
      <Paper
        sx={{
          width: 280,
          flexShrink: 0,
          p: 3,
          borderRadius: 2,
          height: "fit-content",
          position: "sticky",
          top: 20,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Filters
          </Typography>
          <Button
            size="small"
            onClick={() =>
              setFilters({
                search: '',
                location: '',
                boothSize: '',
                status: '',
                sortBy: 'createdAt',
                sortOrder: 'desc'
              })
            }
            sx={{ textTransform: "none", fontSize: "0.85rem" }}
          >
            Clear All
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Location */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Location
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter location"
            value={filters.location}
            onChange={(e) => handleFilterChange("location", e.target.value)}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Booth Size */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Booth Size
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.boothSize}
              onChange={(e) => handleFilterChange("boothSize", e.target.value)}
              displayEmpty
            >
              <MenuItem value="">All Sizes</MenuItem>
              <MenuItem value="2x2">2x2</MenuItem>
              <MenuItem value="4x4">4x4</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Status
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              displayEmpty
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Accept">Accepted</MenuItem>
              <MenuItem value="Reject">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Sort By */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Sort By
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              displayEmpty
            >
              <MenuItem value="createdAt">Date</MenuItem>
              <MenuItem value="Location">Location</MenuItem>
              <MenuItem value="BoothSize">Size</MenuItem>
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
              value={filters.sortOrder}
              onChange={(e) =>
                handleFilterChange("sortOrder", e.target.value)
              }
              displayEmpty
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Right Content Area */}
      <Box sx={{ flex: 1 }}>
        {/* Search Bar and Count */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Paper
            sx={{
              flex: 1,
              borderRadius: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <TextField
              fullWidth
              placeholder="Search booths..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search
                      sx={{
                        color: "text.secondary",
                        fontSize: "1.2rem",
                        ml: 0.5,
                      }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 8,
                  height: 42,
                  "& fieldset": {
                    border: "none",
                  },
                  "& input": {
                    padding: "0",
                    fontSize: "0.9rem",
                  },
                },
              }}
            />
          </Paper>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "nowrap" }}
          >
            ({booths.length} booths)
          </Typography>
        </Box>

        {/* Booths Cards Grid */}
        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            mt={5}
          >
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && booths.length === 0 && (
          <Typography color="text.secondary" mt={3} textAlign="center">
            No booths available.
          </Typography>
        )}

        {!loading && !error && booths.length > 0 && (
          <>
            <Grid container spacing={3}>
              {displayedBooths.map((booth) => (
                <Grid size={{xs: 12, sm: 12, md: 6}} key={booth._id}>
                  <Card
                    sx={{
                      width: 360,
                      height: 280,
                      borderRadius: "16px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.3s",
                      "&:hover": {
                        boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
                        transform: "translateY(-4px)",
                      },
                      overflow: "hidden",
                      position: "relative",
                      background: "white",
                      border: "2px dashed",
                      borderColor: "divider",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "6px",
                        background: boothTypeColor,
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        flex: 1,
                        p: 2.5,
                        pb: 2,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Header with Badge and Icon */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1.5,
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                          <Stack direction="row" spacing={0.5} mb={0.5}>
                            <Chip
                              label="Booth"
                              size="small"
                              sx={{
                                backgroundColor: `${boothTypeColor}12`,
                                color: "black",
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                height: 22,
                                borderRadius: 2,
                              }}
                            />
                            <Chip
                              label={booth.Pending}
                              color={getStatusColor(booth.Pending) as any}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                height: 22,
                                borderRadius: 2,
                              }}
                            />
                          </Stack>
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            color="#000000"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              fontSize: "1.05rem",
                              lineHeight: 1.3,
                            }}
                          >
                            {booth.VendorID?.companyName}
                          </Typography>
                        </Box>

                        {/* Icon - Top Right */}
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            backgroundColor: boothTypeColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            flexShrink: 0,
                            fontSize: "1.3rem",
                          }}
                        >
                          <Storefront />
                        </Box>
                      </Box>

                      {/* Location */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.5,
                          p: 1.2,
                          backgroundColor: "grey.50",
                          borderRadius: 2,
                        }}
                      >
                        <LocationOn
                          sx={{
                            fontSize: "1.1rem",
                            color: boothTypeColor,
                          }}
                        />
                        <Typography
                          variant="body2"
                          color="text.primary"
                          fontWeight={500}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {booth.Location}
                        </Typography>
                      </Box>

                      {/* Booth Details */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.8,
                          mb: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Storefront
                            sx={{
                              fontSize: "1rem",
                              color: "text.secondary",
                            }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Size: {booth.BoothSize}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Timelapse
                            sx={{
                              fontSize: "1rem",
                              color: "text.secondary",
                            }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Setup: {booth.SetupDuration}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <EventIcon
                            sx={{
                              fontSize: "1rem",
                              color: "text.secondary",
                            }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {formatDate(booth.createdAt)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Vendor Info */}
                      {booth.VendorID && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Avatar
                            src={booth.VendorID.logo?.[0]?.url}
                            alt={booth.VendorID.companyName}
                            sx={{ width: 24, height: 24 }}
                          >
                            <Business sx={{ fontSize: "0.9rem" }} />
                          </Avatar>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {booth.VendorID.email}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>

                    {/* Buttons - Fixed at Bottom */}
                    <Box
                      sx={{
                        p: 2.5,
                        pt: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => handleViewDetails(booth)}
                          sx={{
                            bgcolor: boothTypeColor,
                            height: 30,
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 3,
                            "&:hover": {
                              borderColor: boothTypeColor,
                              color: "black",
                            },
                          }}
                        >
                          Ticket Details
                        </Button>
                        {/*
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => {
                            setSelectedBoothToDelete(booth);
                            setDeleteError('');
                            setDeleteDialogOpen(true);
                          }}
                          sx={{
                            height: 30,
                            minWidth: 'auto',
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 3,
                          }}
                        >
                          Delete
                        </Button> 
                        */}
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Load More Button */}
            {hasMoreBooths && (
              <Box
                sx={{ display: "flex", justifyContent: "center", mt: 2 }}
              >
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  sx={{
                    px: 4,
                    py: 1,
                    textTransform: "none",
                    borderRadius: 2,
                    fontWeight: 500,
                  }}
                >
                  Load More
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* View Details Dialog */}
      <BoothDetailsDialog
              open={detailsOpen}
              onClose={handleCloseDetails}
              event={selectedBooth}
              />
      {/*
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(8px)",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "85vh",
          },
        }}
      >
        <Box sx={{ p: 3, pb: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Box flex={1}>
              <Stack direction="row" spacing={1} mb={1.5}>
                <Chip
                  label="Booth"
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                />
                <Chip
                  label={selectedBooth?.Pending || ''}
                  color={getStatusColor(selectedBooth?.Pending || '') as any}
                  size="small"
                  sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                />
              </Stack>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {selectedBooth?.VendorID?.companyName}
              </Typography>
            </Box>
            <IconButton
              onClick={handleCloseDetails}
              size="small"
              sx={{ ml: 2 }}
            >
              <Close />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography
                variant="overline"
                fontWeight={700}
                color="primary.main"
                gutterBottom
                sx={{ fontSize: "0.7rem" }}
              >
                Vendor Information
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Box display="flex" alignItems="center">
                  <Avatar 
                    src={selectedBooth?.VendorID?.logo?.[0]?.url} 
                    alt={selectedBooth?.VendorID?.companyName}
                    sx={{ width: 56, height: 56, mr: 2 }}
                  >
                    <Business />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selectedBooth?.VendorID?.companyName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedBooth?.VendorID?.email}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="overline"
                fontWeight={700}
                color="primary.main"
                gutterBottom
                sx={{ fontSize: "0.7rem" }}
              >
                Booth Details
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Box display="flex" alignItems="top">
                  <LocationOn
                    sx={{ mr: 1.5, color: "primary.main", fontSize: 20 }}
                  />
                  <Box display="flex" gap={1}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      LOCATION:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedBooth?.Location}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="top">
                  <Storefront
                    sx={{ mr: 1.5, color: "primary.main", fontSize: 20 }}
                  />
                  <Box display="flex" gap={1}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      BOOTH SIZE:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedBooth?.BoothSize}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="top">
                  <Timelapse
                    sx={{ mr: 1.5, color: "primary.main", fontSize: 20 }}
                  />
                  <Box display="flex" gap={1}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      SETUP DURATION:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedBooth?.SetupDuration}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="top">
                  <CalendarToday
                    sx={{ mr: 1.5, color: "primary.main", fontSize: 20 }}
                  />
                  <Box display="flex" gap={1}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      REGISTERED:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedBooth && formatDateTime(selectedBooth.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>

            {selectedBooth && selectedBooth.Attendees.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography
                    variant="overline"
                    fontWeight={700}
                    color="primary.main"
                    gutterBottom
                    sx={{ fontSize: "0.7rem" }}
                  >
                    Attendees ({selectedBooth.Attendees.length})
                  </Typography>
                  <List sx={{ mt: 1 }}>
                    {selectedBooth.Attendees.map((attendee, index) => (
                      <ListItem 
                        key={index}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                          mb: 1,
                          "&:last-child": { mb: 0 }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" fontWeight={600}>
                              {attendee.name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {attendee.email}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={handleCloseDetails}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setSelectedBoothToDelete(null); setDeleteError(''); }}
      >
        <DialogTitle>Delete Booth Registration</DialogTitle>
        <DialogContent>
          <Typography>
            {selectedBoothToDelete
              ? `Are you sure you want to delete the booth for "${selectedBoothToDelete.VendorID?.companyName || 'Unknown'}"?`
              : 'Are you sure you want to delete this booth?'}
          </Typography>

          {selectedBoothToDelete && selectedBoothToDelete.Attendees.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              This booth cannot be deleted because it has {selectedBoothToDelete.Attendees.length} registered attendee(s).
            </Alert>
          )}

          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setSelectedBoothToDelete(null); setDeleteError(''); }} disabled={deleteLoading}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!selectedBoothToDelete) return;
              // Prevent deletion if attendees exist (server also enforces this)
              if (selectedBoothToDelete.Attendees.length > 0) {
                setDeleteError('Cannot delete booth: attendees are registered');
                return;
              }
              try {
                setDeleteLoading(true);
                setDeleteError('');
                await api.delete(`/api/booths/${selectedBoothToDelete._id}`);
                // refresh list
                await fetchBooths();
                setDeleteDialogOpen(false);
                setSelectedBoothToDelete(null);
              } catch (err: any) {
                setDeleteError(err.response?.data?.message || err.message || 'Failed to delete booth');
              } finally {
                setDeleteLoading(false);
              }
            }}
            variant="contained"
            color="error"
            disabled={deleteLoading || (selectedBoothToDelete?.Attendees.length ? true : false)}
          >
            {deleteLoading ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}