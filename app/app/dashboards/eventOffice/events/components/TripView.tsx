"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  InputAdornment,
  Paper,
  Divider,
  Grid,
  Menu,
  Stack
} from "@mui/material";
import { 
  Search, 
  Flight, 
  CalendarToday,
  LocationOn,
  AccessTime,
  People,
  AttachMoney,
  EventBusy,
  Add,
  MoreVert,
  Close,
  Event as EventIcon
} from "@mui/icons-material";
import { useEvents, SearchFilters } from "../../../../shared/services";
import { api } from "../../../../../api";
import TripFormDialog from "../../../../shared/components/TripFormDialog";

export default function TripView() {
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    location: '',
    date: '',
    type: '',
    faculty: '',
    sortBy: 'start',
    sortOrder: 'asc'
  });

  const { events, loading, error, fetchEvents } = useEvents('trips');
  const router = useRouter();
  
  const [displayedEventsCount, setDisplayedEventsCount] = useState(6);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchEvents(filters);
    setDisplayedEventsCount(6);
  }, [filters]);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleLoadMore = () => {
    setDisplayedEventsCount(prev => prev + 6);
  };

  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const initialTripForm = {
    name: '',
    location: '',
    price: '',
    start: '',
    end: '',
    time: '',
    shortDescription: '',
    capacity: '',
    registrationDeadline: '',
    restrictedTo: [],
    itinerary: []
  };
  
  const [tripForm, setTripForm] = useState(initialTripForm as any);
  const [formLoading, setFormLoading] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Menu state for three-dot actions
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTrip, setMenuTrip] = useState<any>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Handlers for form dialog
  const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setActiveStep(0);
    setTripForm(initialTripForm);
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (trip: any) => {
    setIsEditMode(true);
    setSelectedTrip(trip);
    setActiveStep(0);
    setTripForm({
      name: trip.name || '',
      location: trip.location || '',
      price: trip.price != null ? String(trip.price) : '',
      start: trip.start ? new Date(trip.start).toISOString().slice(0, 16) : '',
      end: trip.end ? new Date(trip.end).toISOString().slice(0, 16) : '',
      time: trip.time || '',
      shortDescription: trip.shortDescription || '',
      capacity: trip.capacity != null ? String(trip.capacity) : '',
      registrationDeadline: trip.registrationDeadline ? new Date(trip.registrationDeadline).toISOString().slice(0, 16) : '',
      restrictedTo: trip.restrictedTo || [],
      itinerary: trip.itinerary || []
    });
    setFormDialogOpen(true);
    handleCloseMenu();
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedTrip(null);
    setTripForm(initialTripForm);
    setActiveStep(0);
  };

  const handleEventFormSubmit = async () => {
  try {
    setFormLoading(true);

    const formData = new FormData();

    // Required string fields
    formData.append("name", tripForm.name || "");
    formData.append("location", tripForm.location || "");
    formData.append("shortDescription", tripForm.shortDescription || "");

    // Required numbers
    formData.append("price", String(tripForm.price ?? 0));
    formData.append("capacity", String(tripForm.capacity ?? 0));

    // Required dates
    formData.append(
      "start",
      tripForm.start ? new Date(tripForm.start).toISOString() : ""
    );
    formData.append(
      "end",
      tripForm.end ? new Date(tripForm.end).toISOString() : ""
    );
    formData.append(
      "registrationDeadline",
      tripForm.registrationDeadline
        ? new Date(tripForm.registrationDeadline).toISOString()
        : new Date(tripForm.start).toISOString() // 💡 required → fallback
    );

    // Required time string
    formData.append(
      "time",
      new Date(tripForm.start).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );

    // REQUIRED → must be array, not string
    formData.append(
      "restrictedTo",
      JSON.stringify(tripForm.restrictedTo || [])
    );

    // Itinerary
    const mappedItinerary = tripForm.itinerary.map((item, index) => ({
      type: item.type,
      date: item.date,
      name: item.name,
      from: item.from,
      to: item.to,
      hasImage: !!item.imageFile,
      imageIndex: index,
    }));

    formData.append("itinerary", JSON.stringify(mappedItinerary));

    tripForm.itinerary.forEach((item, index) => {
      if (item.imageFile) {
        formData.append(`itinerary_image_${index}`, item.imageFile);
      }
    });

    // Send to backend
    if (isEditMode && selectedTrip) {
      await api.put(`/api/trips/${selectedTrip._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      await api.post("/api/trips/2", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    fetchEvents(filters);
    handleCloseFormDialog();

  } catch (err) {
    console.error("Form submission error:", err);
  } finally {
    setFormLoading(false);
  }
};

  // Menu handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, trip: any) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuTrip(trip);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuTrip(null);
  };

  // Delete handlers
  const handleOpenDeleteDialog = (trip: any) => {
    setSelectedTrip(trip);
    setDeleteError('');
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedTrip(null);
    setDeleteError('');
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError('');
      if (!selectedTrip) throw new Error('No trip selected');
      await api.delete(`/api/trips/${selectedTrip._id}`);
      fetchEvents(filters);
      handleCloseDeleteDialog();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || err.message || 'Failed to delete trip');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTrip = (trip: any) => {
    router.push(`/trip/${trip._id}`);
  };

  const handleViewDetails = (trip: any) => {
    setSelectedTrip(trip);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedTrip(null);
  };

  const isEventPast = (doc: any) => {
    const now = new Date();
    const end = doc.end || doc.endDate || doc.EndDate || doc.start;
    if (!end) return false;
    const d = new Date(end);
    return !isNaN(d.getTime()) && d < now;
  };

  const handleArchive = async (trip: any) => {
    if (!isEventPast(trip)) {
      alert('Only past events can be archived.');
      return;
    }
    if (!window.confirm(`Archive "${trip.name}"?`)) return;
    try {
      console.log('Archiving trip:', trip._id);
      const response = await api.post(`/api/events/trips/${trip._id}/archive`);
      console.log('Archive response:', response);
      fetchEvents(filters);
      alert('Trip archived successfully');
      handleCloseMenu();
    } catch (err: any) {
      console.error('Archive error:', err);
      console.error('Error response:', err.response);
      alert(err.response?.data?.message || err.message || 'Failed to archive trip');
    }
  };

  const handleUnarchive = async (trip: any) => {
    if (!window.confirm(`Unarchive "${trip.name}"?`)) return;
    try {
      console.log('Unarchiving trip:', trip._id);
      const response = await api.post(`/api/events/trips/${trip._id}/unarchive`);
      console.log('Unarchive response:', response);
      fetchEvents(filters);
      alert('Trip unarchived successfully');
      handleCloseMenu();
    } catch (err: any) {
      console.error('Unarchive error:', err);
      console.error('Error response:', err.response);
      alert(err.response?.data?.message || err.message || 'Failed to unarchive trip');
    }
  };

  const displayedEvents = events.slice(0, displayedEventsCount);
  const hasMoreEvents = displayedEventsCount < events.length;

  const eventTypeColor = "#eabfbfff";

  return (
    <Box sx={{ display: "flex", gap: 3 }}>
      {/* Left Sidebar - Filters */}
      <Box sx={{ width: 280, flexShrink: 0 }}>
        {/* Create Trip Button - Square shape above filters */}
        <Button 
          variant="contained" 
          fullWidth
          onClick={handleOpenCreateDialog}
          sx={{ 
            height: 40,
            minHeight: 40,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "1.1rem",
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          <Add />Create Trip
        </Button>

        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            height: "fit-content",
            position: "sticky",
            top: 20,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>Filters</Typography>
            <Button
              size="small"
              onClick={() => setFilters({ search: '', location: '', date: '', type: '', faculty: '', sortBy: 'start', sortOrder: 'asc' })}
              sx={{ textTransform: "none", fontSize: "0.85rem" }}
            >
              Clear All
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Location */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Location</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter location"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Date */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Date</Typography>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange("date", e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Sort By */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Sort By</Typography>
            <FormControl fullWidth size="small">
              <Select value={filters.sortBy} onChange={(e) => handleFilterChange("sortBy", e.target.value)} displayEmpty>
                <MenuItem value="start">Date</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="location">Location</MenuItem>
                <MenuItem value="price">Price</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Sort Order */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Order</Typography>
            <FormControl fullWidth size="small">
              <Select value={filters.sortOrder} onChange={(e) => handleFilterChange("sortOrder", e.target.value)} displayEmpty>
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      </Box>

      {/* Right Content Area */}
      <Box sx={{ flex: 1 }}>
        {/* Search Bar and Count */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Paper sx={{ flex: 1, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid", borderColor: "divider" }}>
            <TextField
              fullWidth
              placeholder="Search trips..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ color: "text.secondary", fontSize: "1.2rem", ml: 0.5 }} /></InputAdornment>,
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 8, height: 42, "& fieldset": { border: "none" }, "& input": { padding: "0", fontSize: "0.9rem" } } }}
            />
          </Paper>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>({events.length} trips)</Typography>
        </Box>

        {/* Trips List */}
        {loading && <Box display="flex" justifyContent="center" alignItems="center" mt={5}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {!loading && !error && events.length === 0 && <Typography color="text.secondary" mt={3} textAlign="center">No trips available.</Typography>}

        {!loading && !error && events.length > 0 && (
          <>
            <Grid container spacing={3}>
              {displayedEvents.map((trip) => (
                <Grid size={{xs: 12, sm: 12, md: 6}} key={trip._id}>
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
                        background: eventTypeColor,
                      },
                    }}
                  >
                    <CardContent sx={{ flex: 1, p: 2.5, pb: 2, display: "flex", flexDirection: "column" }}>
                      {/* Header with Badge and Icon */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                        <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                          <Stack direction="row" spacing={0.5} mb={0.5}>
                            <Chip label="Trip" size="small" sx={{ backgroundColor: `${eventTypeColor}12`, color: "black", fontWeight: 600, fontSize: "0.7rem", height: 22, borderRadius: 2 }} />
                            {trip.isArchived && <Chip label="Archived" color="default" size="small" sx={{ height: 22 }} />}
                          </Stack>
                          <Typography variant="h6" fontWeight={700} color="#000000" sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", fontSize: "1.05rem", lineHeight: 1.3 }}>
                            {trip.name}
                          </Typography>
                        </Box>

                        {/* Icon and Menu Button - Top Right */}
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                          <Box sx={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: eventTypeColor, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, fontSize: "1.3rem" }}>
                            <Flight />
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenMenu(e, trip)}
                            sx={{ 
                              color: "text.secondary",
                              '&:hover': { backgroundColor: 'action.hover' }
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Location */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, p: 1.2, backgroundColor: "grey.50", borderRadius: 2 }}>
                        <LocationOn sx={{ fontSize: "1.1rem", color: eventTypeColor }} />
                        <Typography variant="body2" color="text.primary" fontWeight={500} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {trip.location}
                        </Typography>
                      </Box>

                      {/* Event Details */}
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, mb: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <EventIcon sx={{ fontSize: "1rem", color: "text.secondary" }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(trip.start)} - {formatDate(trip.end || trip.start)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <AccessTime sx={{ fontSize: "1rem", color: "text.secondary" }} />
                          <Typography variant="body2" color="text.secondary">
                            {trip.time}
                          </Typography>
                        </Box>
                        {trip.price && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <AttachMoney sx={{ fontSize: "1rem", color: eventTypeColor }} />
                            <Typography variant="body2" fontWeight={700} color={eventTypeColor}>
                              {trip.price}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Organizer */}
                      {trip.ProfCreator && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              backgroundColor: `${eventTypeColor}20`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: eventTypeColor
                            }}
                          >
                            {trip.ProfCreator.firstName?.charAt(0)}{trip.ProfCreator.lastName?.charAt(0)}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {trip.ProfCreator.firstName} {trip.ProfCreator.lastName}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ flexGrow: 1 }} />
                    </CardContent>

                    {/* Action Buttons */}
                    <Box sx={{ p: 2.5, pt: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => handleTrip(trip)}
                          sx={{
                            bgcolor: eventTypeColor,
                            height: 30,
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 3,
                            "&:hover": {
                              borderColor: eventTypeColor,
                              color: "black",
                            },
                          }}
                        >
                          Ticket Details
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Load More Button */}
            {hasMoreEvents && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
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

      {/* Three-dot Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            minWidth: 140,
          }
        }}
      >
        <MenuItem onClick={() => handleOpenEditDialog(menuTrip)}>
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => menuTrip?.isArchived ? handleUnarchive(menuTrip) : handleArchive(menuTrip)}
        >
          {menuTrip?.isArchived ? 'Unarchive' : 'Archive'}
        </MenuItem>
        <MenuItem onClick={() => handleOpenDeleteDialog(menuTrip)} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>

      {/* New Multi-step Trip Form Dialog */}
      <TripFormDialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        form={tripForm}
        setForm={setTripForm}
        isEdit={isEditMode}
        onSubmit={handleEventFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Trip</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete &quot;{selectedTrip?.name}&quot;?</Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '85vh',
          }
        }}
      >
        <Box sx={{ p: 3, pb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Stack direction="row" spacing={1} mb={1.5}>
                <Chip label="Trip" color="primary" size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
              </Stack>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {selectedTrip?.name}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDetails} size="small" sx={{ ml: 2 }}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="overline" fontWeight={700} color="primary.main" gutterBottom sx={{ fontSize: '0.7rem' }}>
                Trip Information
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Box display="flex" alignItems="top">
                  <CalendarToday sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                  <Box display="flex" gap={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      DATES:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDateTime(selectedTrip?.start || '')} - {formatDateTime(selectedTrip?.end || selectedTrip?.start || '')}
                    </Typography>
                  </Box>
                </Box>

                {selectedTrip?.registrationDeadline && (
                  <Box display="flex" alignItems="top">
                    <EventBusy sx={{ mr: 1.5, color: 'error.main', fontSize: 20 }} />
                    <Box display="flex" gap={1}>
                      <Typography variant="caption" color="error.main" fontWeight={600}>
                        REGISTRATION DEADLINE:
                      </Typography>
                      <Typography variant="body2" fontWeight={500} color="error">
                        {formatDateTime(selectedTrip.registrationDeadline)}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Box display="flex" alignItems="top">
                  <AccessTime sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                  <Box display="flex" gap={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      TIME:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedTrip?.time}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="top">
                  <LocationOn sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                  <Box display="flex" gap={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      LOCATION:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedTrip?.location}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="top">
                  <People sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                  <Box display="flex" gap={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      CAPACITY:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedTrip?.capacity} participants
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="top">
                  <AttachMoney sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                  <Box display="flex" gap={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      PRICE:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      ${selectedTrip?.price}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="overline" fontWeight={700} color="primary.main" gutterBottom sx={{ fontSize: '0.7rem' }}>
                Description
              </Typography>
              <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', mt: 1 }}>
                {selectedTrip?.shortDescription || 'No description available.'}
              </Typography>
            </Box>
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
    </Box>
  );
}