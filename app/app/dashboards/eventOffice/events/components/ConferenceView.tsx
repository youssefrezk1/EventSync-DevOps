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
  Stack,
  Snackbar,
  SnackbarContent
} from "@mui/material";
import { 
  Search, 
  Group, 
  CalendarToday,
  AccessTime,
  AttachMoney,
  Language,
  Add,
  MoreVert,
  Close,
  Event as EventIcon,
  LocationOn,
  CheckCircle,
  Error as ErrorIcon,
  Info as InfoIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Business
} from "@mui/icons-material";
import { useEvents, SearchFilters } from "../../../../shared/services";
import { api } from "../../../../../api";
import ConferenceFormDialog from "@/shared/components/conferenceFormDialog";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export default function ConferenceView() {
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    location: '',
    date: '',
    type: '',
    faculty: '',
    sortBy: 'start',
    sortOrder: 'asc'
  });

  const { events, loading, error, fetchEvents } = useEvents('conferences');
  const router = useRouter();
  
  const [displayedEventsCount, setDisplayedEventsCount] = useState(6);
  const [selectedConference, setSelectedConference] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message: string, severity: SnackbarState['severity']) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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
  
  const initialConferenceForm = {
    name: '',
    start: '',
    endDate: '',
    time: '',
    timeFrom: '',
    timeTo: '',
    shortDescription: '',
    fullAgenda: '',
    conferenceWebsiteLink: '',
    requiredBudget: '',
    sourceOfFunding: '',
    extraRequiredResources: '',
    restrictedTo: []
  };
  
  const [conferenceForm, setConferenceForm] = useState(initialConferenceForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Menu state for three-dot actions
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuConference, setMenuConference] = useState<any>(null);

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

  const formatDateTimeForInput = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  };

  // Handlers for form dialog
  const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setActiveStep(0);
    setConferenceForm(initialConferenceForm);
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (conference: any) => {
    setIsEditMode(true);
    setActiveStep(0);
    setSelectedConference(conference);
    
    let timeFrom = '';
    let timeTo = '';
    if (conference.time) {
      const timeParts = conference.time.split(' - ');
      if (timeParts.length === 2) {
        timeFrom = convertTo24Hour(timeParts[0].trim());
        timeTo = convertTo24Hour(timeParts[1].trim());
      }
    }

    setConferenceForm({
      name: conference.name || '',
      start: formatDateTimeForInput(conference.start),
      endDate: formatDateTimeForInput(conference.endDate || conference.start),
      time: conference.time || '',
      timeFrom: timeFrom,
      timeTo: timeTo,
      shortDescription: conference.shortDescription || '',
      fullAgenda: conference.fullAgenda || '',
      conferenceWebsiteLink: conference.conferenceWebsiteLink || '',
      requiredBudget: conference.requiredBudget || '',
      sourceOfFunding: conference.sourceOfFunding || '',
      extraRequiredResources: conference.extraRequiredResources || '',
      restrictedTo: conference.restrictedTo || []
    });
    setFormDialogOpen(true);
    handleCloseMenu();
  };

  // Helper function to convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12h: string) => {
    if (!time12h) return '';
    
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = String(parseInt(hours, 10) + 12);
    }
    
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setActiveStep(0);
    setSelectedConference(null);
    setConferenceForm(initialConferenceForm);
    setFormError('');
  };

  // Menu handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, conference: any) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuConference(conference);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuConference(null);
  };

  // Delete handlers
  const handleOpenDeleteDialog = (conference: any) => {
    setSelectedConference(conference);
    setDeleteError('');
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedConference(null);
    setDeleteError('');
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError('');
      if (!selectedConference) throw new Error('No conference selected');
      await api.delete(`/api/conferences/${selectedConference._id}`);
      fetchEvents(filters);
      handleCloseDeleteDialog();
      showSnackbar('Conference deleted successfully', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete conference';
      setDeleteError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSubmit = async () => {
    try {
      setFormLoading(true);
      setFormError('');

      // Prepare form data for API
      const formData = {
        ...conferenceForm,
        timeFrom: undefined,
        timeTo: undefined
      };

      if (isEditMode && selectedConference) {
        await api.put(`/api/conferences/${selectedConference._id}`, formData);
      } else {
        await api.post('/api/conferences', formData);
      }

      fetchEvents(filters);
      handleCloseFormDialog();
      showSnackbar(`Conference ${isEditMode ? 'updated' : 'created'} successfully`, 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save conference';
      setFormError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConference = (conference: any) => {
    router.push(`/confrence/${conference._id}`);
  };

  const handleViewDetails = (conference: any) => {
    setSelectedConference(conference);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedConference(null);
  };

  const isEventPast = (doc: any) => {
    const now = new Date();
    const end = doc.endDate || doc.end || doc.start;
    if (!end) return false;
    const d = new Date(end);
    return !isNaN(d.getTime()) && d < now;
  };

  const handleArchive = async (conference: any) => {
    if (!isEventPast(conference)) {
      showSnackbar('Only past events can be archived', 'warning');
      return;
    }
    if (!window.confirm(`Archive "${conference.name}"?`)) return;
    try {
      const response = await api.post(`/api/events/conferences/${conference._id}/archive`);
      fetchEvents(filters);
      showSnackbar('Conference archived successfully', 'success');
      handleCloseMenu();
    } catch (err: any) {
      showSnackbar(err.response?.data?.message || err.message || 'Failed to archive conference', 'error');
    }
  };

  const handleUnarchive = async (conference: any) => {
    if (!window.confirm(`Unarchive "${conference.name}"?`)) return;
    try {
      const response = await api.post(`/api/events/conferences/${conference._id}/unarchive`);
      fetchEvents(filters);
      showSnackbar('Conference unarchived successfully', 'success');
      handleCloseMenu();
    } catch (err: any) {
      showSnackbar(err.response?.data?.message || err.message || 'Failed to unarchive conference', 'error');
    }
  };

  const displayedEvents = events.slice(0, displayedEventsCount);
  const hasMoreEvents = displayedEventsCount < events.length;

  const eventTypeColor = "#e1daceff";

  // Update menu items with icons
  const menuItems = [
    {
      label: 'Edit',
      icon: <EditIcon sx={{ mr: 1.5, fontSize: 20 }} />,
      onClick: () => handleOpenEditDialog(menuConference),
      color: 'inherit'
    },
    {
      label: menuConference?.isArchived ? 'Unarchive' : 'Archive',
      icon: menuConference?.isArchived ? 
        <UnarchiveIcon sx={{ mr: 1.5, fontSize: 20 }} /> : 
        <ArchiveIcon sx={{ mr: 1.5, fontSize: 20 }} />,
      onClick: () => menuConference?.isArchived ? 
        handleUnarchive(menuConference) : 
        handleArchive(menuConference),
      color: 'inherit'
    },
    {
      label: 'Delete',
      icon: <DeleteIcon sx={{ mr: 1.5, fontSize: 20 }} />,
      onClick: () => handleOpenDeleteDialog(menuConference),
      color: 'error.main'
    }
  ];

  return (
    <Box sx={{ display: "flex", gap: 3 }}>
      {/* Left Sidebar - Filters */}
      <Box sx={{ width: 280, flexShrink: 0 }}>
        {/* Create Conference Button - Square shape above filters */}
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
          <Add />Create Conference
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

          {/* Source */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Source</Typography>
            <FormControl fullWidth size="small">
              <Select value={filters.type} onChange={(e) => handleFilterChange("type", e.target.value)} displayEmpty>
                <MenuItem value="">All Sources</MenuItem>
                <MenuItem value="external">External</MenuItem>
                <MenuItem value="GUC">GUC</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Sort By */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Sort By</Typography>
            <FormControl fullWidth size="small">
              <Select value={filters.sortBy} onChange={(e) => handleFilterChange("sortBy", e.target.value)} displayEmpty>
                <MenuItem value="start">Date</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="requiredBudget">Budget</MenuItem>
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
              placeholder="Search conferences..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ color: "text.secondary", fontSize: "1.2rem", ml: 0.5 }} /></InputAdornment>,
              }}
              sx={{ 
                "& .MuiOutlinedInput-root": { 
                  borderRadius: 8, 
                  height: 42, 
                  "& fieldset": { border: "none" }, 
                  "& input": { padding: "0", fontSize: "0.9rem" } 
                } 
              }}
            />
          </Paper>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>({events.length} conferences)</Typography>
        </Box>

        {/* Conferences List */}
        {loading && <Box display="flex" justifyContent="center" alignItems="center" mt={5}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {!loading && !error && events.length === 0 && <Typography color="text.secondary" mt={3} textAlign="center">No conferences available.</Typography>}

        {!loading && !error && events.length > 0 && (
          <>
            <Grid container spacing={3}>
              {displayedEvents.map((conference) => (
                <Grid size={{xs: 12, sm: 12, md: 6}} key={conference._id}>
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
                          <Stack direction="row" spacing={0.5} mb={0.5} flexWrap="wrap">
                            <Chip label="Conference" size="small" sx={{ backgroundColor: `${eventTypeColor}12`, color: "black", fontWeight: 600, fontSize: "0.7rem", height: 22, borderRadius: 2 }} />
                            <Chip label={conference.sourceOfFunding} size="small" sx={{ backgroundColor: `${eventTypeColor}12`, color: "black", fontWeight: 600, fontSize: "0.7rem", height: 22, borderRadius: 2 }} />
                            {conference.isArchived && <Chip label="Archived" color="default" size="small" sx={{ height: 22 }} />}
                          </Stack>
                          <Typography variant="h6" fontWeight={700} color="#000000" sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", fontSize: "1.05rem", lineHeight: 1.3 }}>
                            {conference.name}
                          </Typography>
                        </Box>

                        {/* Icon and Menu Button - Top Right */}
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                          <Box sx={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: eventTypeColor, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, fontSize: "1.3rem" }}>
                            <Group />
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenMenu(e, conference)}
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
                      {conference.location && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, p: 1.2, backgroundColor: "grey.50", borderRadius: 2 }}>
                          <LocationOn sx={{ fontSize: "1.1rem", color: eventTypeColor }} />
                          <Typography variant="body2" color="text.primary" fontWeight={500} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {conference.location}
                          </Typography>
                        </Box>
                      )}

                      {/* Event Details */}
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, mb: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <EventIcon sx={{ fontSize: "1rem", color: "text.secondary" }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(conference.start)} - {formatDate(conference.endDate || conference.start)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <AccessTime sx={{ fontSize: "1rem", color: "text.secondary" }} />
                          <Typography variant="body2" color="text.secondary">
                            {conference.time}
                          </Typography>
                        </Box>
                        {conference.requiredBudget && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <AttachMoney sx={{ fontSize: "1rem", color: eventTypeColor }} />
                            <Typography variant="body2" fontWeight={700} color={eventTypeColor}>
                              {conference.requiredBudget}
                            </Typography>
                          </Box>
                        )}
                        {conference.conferenceWebsiteLink && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Language sx={{ fontSize: "1rem", color: "text.secondary" }} />
                            <Typography variant="body2" color="text.secondary" component="a" href={conference.conferenceWebsiteLink} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", "&:hover": { color: eventTypeColor, textDecoration: "underline" } }}>
                              Website
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Organizer */}
                      {conference.ProfCreator && (
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
                            {conference.ProfCreator.firstName?.charAt(0)}{conference.ProfCreator.lastName?.charAt(0)}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {conference.ProfCreator.firstName} {conference.ProfCreator.lastName}
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
                          onClick={() => handleConference(conference)}
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

      {/* Three-dot Menu - Updated with icons */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            minWidth: 160,
          }
        }}
      >
        {menuItems.map((item, index) => (
          <MenuItem 
            key={index}
            onClick={item.onClick}
            sx={{ color: item.color }}
          >
            {item.icon}
            {item.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Multi-step Form Dialog */}
      <ConferenceFormDialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        form={conferenceForm}
        setForm={setConferenceForm}
        isEdit={isEditMode}
        onSubmit={handleFormSubmit}
        loading={formLoading}
        error={formError}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Conference</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete &quot;{selectedConference?.name}&quot;?</Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog - Fixed hydration issue by using Box for content instead of nested Typography */}
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
                <Chip label="Conference" color="primary" size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                <Chip label={selectedConference?.sourceOfFunding} variant="outlined" size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
              </Stack>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {selectedConference?.name}
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
                Conference Information
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Box display="flex" alignItems="top">
                  <CalendarToday sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                  <Box display="flex" gap={1}>
                    <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                      DATES:
                    </Box>
                    <Box component="span" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {formatDateTime(selectedConference?.start || '')} - {formatDateTime(selectedConference?.endDate || selectedConference?.start || '')}
                    </Box>
                  </Box>
                </Box>

                <Box display="flex" alignItems="top">
                  <AccessTime sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                  <Box display="flex" gap={1}>
                    <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                      TIME:
                    </Box>
                    <Box component="span" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {selectedConference?.time}
                    </Box>
                  </Box>
                </Box>

                {selectedConference?.requiredBudget && (
                  <Box display="flex" alignItems="top">
                    <AttachMoney sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                    <Box display="flex" gap={1}>
                      <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                        BUDGET:
                      </Box>
                      <Box component="span" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        ${selectedConference.requiredBudget}
                      </Box>
                    </Box>
                  </Box>
                )}

                {selectedConference?.conferenceWebsiteLink && (
                  <Box display="flex" alignItems="top">
                    <Language sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                    <Box display="flex" gap={1}>
                      <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                        WEBSITE:
                      </Box>
                      <Box 
                        component="a" 
                        href={selectedConference.conferenceWebsiteLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        sx={{ 
                          fontSize: '0.875rem', 
                          fontWeight: 500, 
                          color: "primary.main", 
                          textDecoration: "none", 
                          "&:hover": { textDecoration: "underline" } 
                        }}
                      >
                        Visit Conference Website
                      </Box>
                    </Box>
                  </Box>
                )}

                {selectedConference?.ProfCreator && (
                  <Box display="flex" alignItems="top">
                    <Business sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                    <Box display="flex" gap={1}>
                      <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                        ORGANIZER:
                      </Box>
                      <Box component="span" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {selectedConference.ProfCreator.firstName} {selectedConference.ProfCreator.lastName}
                      </Box>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="overline" fontWeight={700} color="primary.main" gutterBottom sx={{ fontSize: '0.7rem' }}>
                Description
              </Typography>
              <Box component="div" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', mt: 1, fontSize: '0.875rem', color: 'text.primary' }}>
                {selectedConference?.shortDescription || 'No description available.'}
              </Box>
            </Box>

            {selectedConference?.extraRequiredResources && (
              <>
                <Divider />
                <Box>
                  <Typography variant="overline" fontWeight={700} color="primary.main" gutterBottom sx={{ fontSize: '0.7rem' }}>
                    Required Resources
                  </Typography>
                  <Box component="div" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', mt: 1, fontSize: '0.875rem', color: 'text.primary' }}>
                    {selectedConference.extraRequiredResources}
                  </Box>
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <SnackbarContent
          sx={{
            bgcolor: snackbar.severity === 'success' ? '#10b981' :
                     snackbar.severity === 'error' ? '#ef4444' :
                     snackbar.severity === 'warning' ? '#f59e0b' : '#3b82f6',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
          message={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {snackbar.severity === 'success' && <CheckCircle sx={{ color: 'white' }} />}
              {snackbar.severity === 'error' && <ErrorIcon sx={{ color: 'white' }} />}
              {snackbar.severity === 'warning' && <ErrorIcon sx={{ color: 'white' }} />}
              {snackbar.severity === 'info' && <InfoIcon sx={{ color: 'white' }} />}
              <Typography sx={{ color: 'white', fontWeight: 500 }}>
                {snackbar.message}
              </Typography>
            </Box>
          }
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleSnackbarClose}
            >
              <Close fontSize="small" />
            </IconButton>
          }
        />
      </Snackbar>
    </Box>
  );
}