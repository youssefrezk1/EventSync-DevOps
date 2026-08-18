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
  SnackbarContent        // ADD THIS
} from "@mui/material";
import { 
  Search, 
  School, 
  CalendarToday,
  LocationOn,
  AccessTime,
  People,
  Person,
  Add,
  MoreVert,
  Close,
  Event as EventIcon,
  AttachMoney,
  Archive as ArchiveIcon,      // ADD THIS
  Unarchive as UnarchiveIcon,  // ADD THIS
  Delete as DeleteIcon,        // ADD THIS
  CheckCircle,                 // ADD THIS
  Error as ErrorIcon,          // ADD THIS
  Info as InfoIcon   
} from "@mui/icons-material";
import { useEvents, SearchFilters } from "../../../../shared/services";
import { api } from "../../../../../api";
import WorkshopFormDialog from "../../../../shared/components/WorkshopFormDialog";

export default function WorkshopView() {
  const [professorsList, setProfessorsList] = useState<any[]>([]);
  const [professorsLoading, setProfessorsLoading] = useState(true);
  const router = useRouter();
  
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    location: '',
    date: '',
    type: '',
    faculty: '',
    sortBy: 'start',
    sortOrder: 'asc',
    professorName: ''
  });

  const { events, loading, error, fetchEvents } = useEvents('workshops');
  
  const [displayedEventsCount, setDisplayedEventsCount] = useState(6);
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchProfessors = async () => {
    try {
      setProfessorsLoading(true);
      const response = await api.get("/api/workshops/professor"); 
      setProfessorsList(response.data || []);
    } catch (error) {
      console.error("Error fetching professors:", error);
    } finally {
      setProfessorsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(filters);
    fetchProfessors();
    setDisplayedEventsCount(6);
  }, [filters]);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleLoadMore = () => {
    setDisplayedEventsCount(prev => prev + 6);
  };

  const handleOpenViewTicket = (workshop: any) => {
    router.push(`/workshop/${workshop._id}`);
  };

  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const initialWorkshopForm = {
    name: '',
    location: '',
    start: '',
    end: '',
    time: '',
    shortDescription: '',
    capacity: '',
    facultyResponsible: '',
    professorName: '',
    status: 'confirmed'
  };
  
  const [workshopForm, setWorkshopForm] = useState(initialWorkshopForm as any);
  const [formLoading, setFormLoading] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ADD THIS CONFIRMATION DIALOG STATE HERE:
// Confirmation dialog state
const [confirmDialog, setConfirmDialog] = useState({
  open: false,
  title: '',
  message: '',
  actionType: '' as 'archive' | 'unarchive' | 'delete',
  workshop: null as any | null,
  loading: false,
});

const [snackbar, setSnackbar] = useState<{
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}>({
  open: false,
  message: '',
  severity: 'success',
});

  // Menu state for three-dot actions
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuWorkshop, setMenuWorkshop] = useState<any>(null);

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

  // ADD THESE HELPER FUNCTIONS HERE:
// Get dialog icon and color based on action type
const getDialogConfig = (actionType: string) => {
  switch (actionType) {
    case 'archive':
      return {
        icon: <ArchiveIcon />,
        bgColor: '#fef3c7',
        borderColor: '#fbbf24',
        iconBgColor: '#f59e0b',
        titleColor: '#92400e',
      };
    case 'unarchive':
      return {
        icon: <UnarchiveIcon />,
        bgColor: '#f0fdf4',
        borderColor: '#bbf7d0',
        iconBgColor: '#22c55e',
        titleColor: '#166534',
      };
    case 'delete':
      return {
        icon: <DeleteIcon />,
        bgColor: '#fef2f2',
        borderColor: '#fecaca',
        iconBgColor: '#ef4444',
        titleColor: '#991b1b',
      };
    default:
      return {
        icon: <InfoIcon />,
        bgColor: '#f0f9ff',
        borderColor: '#bae6fd',
        iconBgColor: '#0ea5e9',
        titleColor: '#0c4a6e',
      };
  }
};

// ADD THESE SNACKBAR FUNCTIONS HERE:
const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
  setSnackbar({
    open: true,
    message,
    severity,
  });
};

const handleSnackbarClose = () => {
  setSnackbar({ ...snackbar, open: false });
};

  // Handlers for form dialog
  const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setActiveStep(0);
    setWorkshopForm(initialWorkshopForm);
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (workshop: any) => {
    setIsEditMode(true);
    setSelectedWorkshop(workshop);
    setActiveStep(0);
    setWorkshopForm({
      name: workshop.name || '',
      location: workshop.location || '',
      start: workshop.start ? new Date(workshop.start).toISOString().slice(0, 16) : '',
      end: workshop.end ? new Date(workshop.end).toISOString().slice(0, 16) : '',
      time: workshop.time || '',
      shortDescription: workshop.shortDescription || '',
      capacity: workshop.capacity != null ? String(workshop.capacity) : '',
      facultyResponsible: workshop.facultyResponsible || '',
      professorName: workshop.professorName || '',
      status: workshop.status || 'confirmed'
    });
    setFormDialogOpen(true);
    handleCloseMenu();
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedWorkshop(null);
    setWorkshopForm(initialWorkshopForm);
    setActiveStep(0);
  };

  const handleEventFormSubmit = async () => {
    try {
      setFormLoading(true);

      // Transform form data for API
      const payload: any = {
        name: workshopForm.name,
        location: workshopForm.location,
        start: workshopForm.start ? new Date(workshopForm.start).toISOString() : null,
        end: workshopForm.end ? new Date(workshopForm.end).toISOString() : null,
        time: new Date(workshopForm.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        shortDescription: workshopForm.shortDescription,
        capacity: parseInt(String(workshopForm.capacity || 0), 10),
        facultyResponsible: workshopForm.facultyResponsible,
        professorName: workshopForm.professorName,
        status: workshopForm.status
      };

      if (isEditMode && selectedWorkshop) {
        await api.put(`/api/workshops/${selectedWorkshop._id}`, payload);
      } else {
        await api.post('/api/workshops', payload);
      }

      fetchEvents(filters);
      handleCloseFormDialog();
    } catch (err: any) {
      console.error('Form submission error:', err);
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  // Menu handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, workshop: any) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuWorkshop(workshop);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuWorkshop(null);
  };

  // Delete handlers
  const handleOpenDeleteDialog = (workshop: any) => {
    setSelectedWorkshop(workshop);
    setDeleteError('');
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedWorkshop(null);
    setDeleteError('');
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError('');
      if (!selectedWorkshop) throw new Error('No workshop selected');
      await api.delete(`/api/workshops/${selectedWorkshop._id}`);
      fetchEvents(filters);
      handleCloseDeleteDialog();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || err.message || 'Failed to delete workshop');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewDetails = (workshop: any) => {
    setSelectedWorkshop(workshop);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedWorkshop(null);
  };

  const isEventPast = (doc: any) => {
    const now = new Date();
    const end = doc.end || doc.endDate || doc.EndDate || doc.start;
    if (!end) return false;
    const d = new Date(end);
    return !isNaN(d.getTime()) && d < now;
  };

  // Open confirmation dialog for archive/unarchive
const handleOpenConfirmDialog = (actionType: 'archive' | 'unarchive', workshop: any) => {
  const isPastEvent = isEventPast(workshop);
  
  if (actionType === 'archive' && !isPastEvent) {
    showSnackbar('Only past events can be archived', 'warning');
    return;
  }

  const titles = {
    archive: 'Archive Workshop',
    unarchive: 'Unarchive Workshop',
  };

  const messages = {
    archive: `Are you sure you want to archive "${workshop.name}"? Archived workshops will be moved to the archives section.`,
    unarchive: `Are you sure you want to unarchive "${workshop.name}"? Unarchived workshops will be restored to the active list.`,
  };

  setConfirmDialog({
    open: true,
    title: titles[actionType],
    message: messages[actionType],
    actionType,
    workshop,
    loading: false,
  });
  handleCloseMenu();
};

const handleCloseConfirmDialog = () => {
  setConfirmDialog({
    ...confirmDialog,
    open: false,
    loading: false,
  });
};

// Handle the confirmed action
const handleConfirmAction = async () => {
  const { actionType, workshop } = confirmDialog;
  if (!workshop) return;

  try {
    setConfirmDialog(prev => ({ ...prev, loading: true }));
    
    if (actionType === 'archive') {
      await api.post(`/api/events/workshops/${workshop._id}/archive`);
    } else if (actionType === 'unarchive') {
      await api.post(`/api/events/workshops/${workshop._id}/unarchive`);
    }

    const successMessages = {
      archive: 'Workshop archived successfully',
      unarchive: 'Workshop unarchived successfully',
    };

    // REPLACE alert() WITH showSnackbar()
    showSnackbar(successMessages[actionType], 'success');
    fetchEvents(filters);
    handleCloseConfirmDialog();
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || err.message || `Failed to ${actionType} workshop`;
    // REPLACE alert() WITH showSnackbar()
    showSnackbar(errorMessage, 'error');
    setConfirmDialog(prev => ({ ...prev, loading: false }));
  }
};

  const displayedEvents = events.slice(0, displayedEventsCount);
  const hasMoreEvents = displayedEventsCount < events.length;

  const facultyOptions = [
    'MGT', 'BI', 'MET', 'IET', 'EMS', 'CIVIL', 'ARCH', 'AA', 'PH/BIO', 'LAW'
  ];

  const eventTypeColor = "#dbbbe2ff";

  return (
    <Box sx={{ display: "flex", gap: 3 }}>
      {/* Left Sidebar - Filters */}
      <Box sx={{ width: 280, flexShrink: 0 }}>
       

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
              onClick={() => setFilters({
                search: '',
                location: '',
                date: '',
                type: '',
                faculty: '',
                sortBy: 'start',
                sortOrder: 'asc',
                professorName: ''
              })}
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

          {/* Faculty */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Faculty</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.faculty}
                onChange={(e) => handleFilterChange("faculty", e.target.value)}
                displayEmpty
              >
                <MenuItem value="">All Faculties</MenuItem>
                {facultyOptions.map(faculty => (
                  <MenuItem key={faculty} value={faculty}>{faculty}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Professor */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Professor</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.professorName}
                onChange={(e) => handleFilterChange("professorName", e.target.value)}
                displayEmpty
              >
                <MenuItem value="">All Professors</MenuItem>
                {professorsLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} />
                  </MenuItem>
                ) : professorsList.length > 0 ? (
                  professorsList.map((prof: string, index: number) => (
                    <MenuItem key={index} value={prof}>{prof}</MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No professors available</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Sort By */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Sort By</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                displayEmpty
              >
                <MenuItem value="start">Date</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="location">Location</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Sort Order */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Order</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
                displayEmpty
              >
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
              placeholder="Search workshops..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ color: "text.secondary", fontSize: "1.2rem", ml: 0.5 }} /></InputAdornment>,
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 8, height: 42, "& fieldset": { border: "none" }, "& input": { padding: "0", fontSize: "0.9rem" } } }}
            />
          </Paper>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>({events.length} workshops)</Typography>
        </Box>

        {/* Workshops List */}
        {loading && <Box display="flex" justifyContent="center" alignItems="center" mt={5}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {!loading && !error && events.length === 0 && <Typography color="text.secondary" mt={3} textAlign="center">No workshops available.</Typography>}

        {!loading && !error && events.length > 0 && (
          <>
            <Grid container spacing={3}>
              {displayedEvents.map((workshop) => (
                <Grid size={{xs: 12, sm: 12, md: 6}} key={workshop._id}>
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
                            <Chip label="Workshop" size="small" sx={{ backgroundColor: `${eventTypeColor}12`, color: "black", fontWeight: 600, fontSize: "0.7rem", height: 22, borderRadius: 2 }} />
                            <Chip label={workshop.facultyResponsible} size="small" sx={{ backgroundColor: `${eventTypeColor}12`, color: "black", fontWeight: 600, fontSize: "0.7rem", height: 22, borderRadius: 2 }} />
                            {workshop.isArchived && <Chip label="Archived" color="default" size="small" sx={{ height: 22 }} />}
                          </Stack>
                          <Typography variant="h6" fontWeight={700} color="#000000" sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", fontSize: "1.05rem", lineHeight: 1.3 }}>
                            {workshop.name}
                          </Typography>
                        </Box>

                        {/* Icon and Menu Button - Top Right */}
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                          <Box sx={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: eventTypeColor, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, fontSize: "1.3rem" }}>
                            <School />
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenMenu(e, workshop)}
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
                          {workshop.location}
                        </Typography>
                      </Box>

                      {/* Event Details */}
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, mb: 1.5 }}>
                        <Box display={"flex"} gap={3}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <EventIcon sx={{ fontSize: "1rem", color: "text.secondary" }} />
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(workshop.start)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <AccessTime sx={{ fontSize: "1rem", color: "text.secondary" }} />
                            <Typography variant="body2" color="text.secondary">
                              {workshop.time}
                            </Typography>
                          </Box>
                        </Box>
                  
                      </Box>

                      {/* Organizer */}
                      {workshop.ProfCreator && (
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
                            {workshop.ProfCreator.firstName?.charAt(0)}{workshop.ProfCreator.lastName?.charAt(0)}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {workshop.ProfCreator.firstName} {workshop.ProfCreator.lastName}
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
                          onClick={() => handleOpenViewTicket(workshop)}
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
        
        <MenuItem 
          onClick={() => handleOpenConfirmDialog(
            menuWorkshop?.isArchived ? 'unarchive' : 'archive',
            menuWorkshop
          )}
        >
          {menuWorkshop?.isArchived ? 'Unarchive' : 'Archive'}
        </MenuItem>
        <MenuItem onClick={() => handleOpenDeleteDialog(menuWorkshop)} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>

      {/* Workshop Form Dialog */}
      <WorkshopFormDialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        form={workshopForm}
        setForm={setWorkshopForm}
        isEdit={isEditMode}
        onSubmit={handleEventFormSubmit}
        professorsList={professorsList}
        facultyOptions={facultyOptions}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Workshop</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete &quot;{selectedWorkshop?.name}&quot;?</Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>

      {/* ADD THE CONFIRMATION DIALOG HERE: */}
      {/* Confirmation Dialog for Archive/Unarchive */}
      <Dialog 
        open={confirmDialog.open} 
        onClose={confirmDialog.loading ? undefined : handleCloseConfirmDialog} 
        maxWidth="sm" 
        fullWidth
      >
        {confirmDialog.workshop && (
          <>
            <DialogTitle
              sx={{
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                bgcolor: getDialogConfig(confirmDialog.actionType).bgColor,
                borderBottom: `2px solid ${getDialogConfig(confirmDialog.actionType).borderColor}`,
                pb: 2,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  bgcolor: getDialogConfig(confirmDialog.actionType).iconBgColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                {getDialogConfig(confirmDialog.actionType).icon}
              </Box>
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    color: getDialogConfig(confirmDialog.actionType).titleColor
                  }}
                >
                  {confirmDialog.title}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: getDialogConfig(confirmDialog.actionType).titleColor,
                    opacity: 0.8
                  }}
                >
                  Please confirm your action
                </Typography>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ px: 4, py: 3 }}>
              <Typography sx={{ mb: 3, color: "#475569", fontSize: '0.95rem' }}>
                {confirmDialog.message}
              </Typography>
              
              <Box
                sx={{
                  p: 3,
                  bgcolor: "#f8fafc",
                  borderRadius: 2,
                  border: "2px solid #e2e8f0",
                  mb: 2,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: "#111827" }}>
                  {confirmDialog.workshop.name}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOn sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Location:</strong> {confirmDialog.workshop.location || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarToday sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Date:</strong> {formatDate(confirmDialog.workshop.start)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <School sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Faculty:</strong> {confirmDialog.workshop.facultyResponsible || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <People sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Capacity:</strong> {confirmDialog.workshop.capacity} participants
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#64748b", fontStyle: "italic" }}>
                    {confirmDialog.actionType === 'archive' 
                      ? "📁 This workshop will be moved to archives and hidden from the main view."
                      : "📂 This workshop will be restored to the active list."}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 4, py: 3, bgcolor: "#f8fafc", gap: 2 }}>
              <Button
                onClick={handleCloseConfirmDialog}
                variant="outlined"
                disabled={confirmDialog.loading}
                sx={{
                  px: 3,
                  py: 1,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  borderColor: "#cbd5e1",
                  color: "#64748b",
                  "&:hover": {
                    borderColor: "#94a3b8",
                    bgcolor: "#f1f5f9",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAction}
                variant="contained"
                disabled={confirmDialog.loading}
                sx={{
                  px: 3,
                  py: 1,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  bgcolor: getDialogConfig(confirmDialog.actionType).iconBgColor,
                  "&:hover": {
                    bgcolor: getDialogConfig(confirmDialog.actionType).iconBgColor,
                    opacity: 0.9,
                  },
                }}
              >
                {confirmDialog.loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : confirmDialog.actionType === 'archive' ? (
                  'Archive Workshop'
                ) : (
                  'Unarchive Workshop'
                )}
              </Button>
            </DialogActions>
          </>
        )}
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
                <Chip label="Workshop" color="primary" size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                <Chip label={selectedWorkshop?.facultyResponsible} variant="outlined" size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
              </Stack>
              <Typography variant="h6" fontWeight={900} color="text.primary">
                {selectedWorkshop?.name}
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
                Workshop Information
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Box display="flex" alignItems="top">
                  <CalendarToday sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                  <Box display="flex" gap={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      START & END DATES:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDateTime(selectedWorkshop?.start || '')}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      -
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDateTime(selectedWorkshop?.end || '')}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="top">
                  <AccessTime sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                  <Box display="flex" gap={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      TIME:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedWorkshop?.time}
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
                      {selectedWorkshop?.location}
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
                      {selectedWorkshop?.capacity} participants
                    </Typography>
                  </Box>
                </Box>

                {selectedWorkshop?.ProfCreator && (
                  <Box display="flex" alignItems="top">
                    <Person sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                    <Box display="flex" gap={1}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        HEAD PROFESSOR:
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        Prof. {selectedWorkshop.ProfCreator.firstName} {selectedWorkshop.ProfCreator.lastName}
                      </Typography>
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
              <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', mt: 1 }}>
                {selectedWorkshop?.shortDescription || 'No description available.'}
              </Typography>
            </Box>

            {selectedWorkshop?.requiredBudget && (
              <>
                <Divider />
                <Box>
                  <Typography variant="overline" fontWeight={700} color="primary.main" gutterBottom sx={{ fontSize: '0.7rem' }}>
                    Budget
                  </Typography>
                  <Typography variant="body2" fontWeight={500} mt={1}>
                    ${selectedWorkshop.requiredBudget}
                  </Typography>
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

      {/* ADD THIS SNACKBAR HERE AT THE END: */}
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