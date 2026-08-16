"use client";

import { useState, useEffect } from "react";
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
  Store, 
  CalendarToday,
  Event as EventIcon,
  LocationOn,
  AccessTime,
  Add,
  MoreVert,
  Close,
  Business,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Delete as DeleteIcon,
  CheckCircle,
  Error as ErrorIcon,
  Info as InfoIcon,
  Edit as EditIcon
} from "@mui/icons-material";
import { useEvents, SearchFilters } from "../../../../shared/services";
import { api } from "../../../../../api";
import { useRouter } from "next/navigation";
import CreateBazaarForm from "@/shared/components/BazaarFormDialog";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

interface ConfirmationDialog {
  open: boolean;
  title: string;
  message: string;
  actionType: 'archive' | 'unarchive' | 'delete';
  bazaar: any;
  loading: boolean;
}

export default function BazaarView() {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    location: '',
    date: '',
    type: '',
    faculty: '',
    sortBy: 'start',
    sortOrder: 'asc'
  });

  const { events, loading, fetchEvents } = useEvents('bazaars');
  const [displayedEventsCount, setDisplayedEventsCount] = useState(6);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    open: false,
    title: '',
    message: '',
    actionType: 'archive',
    bazaar: null,
    loading: false,
  });

  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBazaar, setSelectedBazaar] = useState<any>(null);
  
  // Menu state for three-dot actions
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuBazaar, setMenuBazaar] = useState<any>(null);

  // Details dialog state
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchEvents(filters);
    setDisplayedEventsCount(6);
  }, [filters]);

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

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleLoadMore = () => {
    setDisplayedEventsCount(prev => prev + 6);
  };

  // Handlers for form dialog
  const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setSelectedBazaar(null);
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (bazaar: any) => {
    setIsEditMode(true);
    setSelectedBazaar(bazaar);
    setFormDialogOpen(true);
    handleCloseMenu();
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedBazaar(null);
  };

  const handleFormSuccess = () => {
    fetchEvents(filters);
    handleCloseFormDialog();
    showSnackbar(`Bazaar ${isEditMode ? 'updated' : 'created'} successfully`, 'success');
  };

  // View handler - redirects to bazaar details page
  const handleViewBazaar = (bazaar: any) => {
    router.push(`/bazaar/${bazaar._id}`);
  };

  // Menu handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, bazaar: any) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuBazaar(bazaar);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuBazaar(null);
  };

  // Open confirmation dialog for archive/unarchive/delete
  const handleOpenConfirmDialog = (actionType: 'archive' | 'unarchive' | 'delete', bazaar: any) => {
    const isPastEvent = isEventPast(bazaar);
    
    if (actionType === 'archive' && !isPastEvent) {
      showSnackbar('Only past events can be archived', 'warning');
      return;
    }

    const titles = {
      archive: 'Archive Bazaar',
      unarchive: 'Unarchive Bazaar',
      delete: 'Delete Bazaar'
    };

    const messages = {
      archive: `Are you sure you want to archive the bazaar "${bazaar.name}"? Archived bazaars will be moved to the archives section.`,
      unarchive: `Are you sure you want to unarchive the bazaar "${bazaar.name}"? Unarchived bazaars will be restored to the active list.`,
      delete: `Are you sure you want to permanently delete the bazaar "${bazaar.name}"? This action cannot be undone.`
    };

    setConfirmDialog({
      open: true,
      title: titles[actionType],
      message: messages[actionType],
      actionType,
      bazaar,
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
    const { actionType, bazaar } = confirmDialog;
    if (!bazaar) return;

    try {
      setConfirmDialog(prev => ({ ...prev, loading: true }));
      
      let response;
      switch (actionType) {
        case 'archive':
          response = await api.post(`/api/events/bazaars/${bazaar._id}/archive`);
          break;
        case 'unarchive':
          response = await api.post(`/api/events/bazaars/${bazaar._id}/unarchive`);
          break;
        case 'delete':
          response = await api.delete(`/eventOffice/bazaars/${bazaar._id}`);
          break;
      }

      const successMessages = {
        archive: 'Bazaar archived successfully',
        unarchive: 'Bazaar unarchived successfully',
        delete: 'Bazaar deleted successfully'
      };

      showSnackbar(successMessages[actionType], 'success');
      fetchEvents(filters);
      handleCloseConfirmDialog();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || `Failed to ${actionType} bazaar`;
      showSnackbar(errorMessage, 'error');
      setConfirmDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleViewDetails = (bazaar: any) => {
    setSelectedBazaar(bazaar);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedBazaar(null);
  };

  const isEventPast = (doc: any) => {
    const now = new Date();
    const end = doc.endDate || doc.end || doc.start;
    if (!end) return false;
    const d = new Date(end);
    return !isNaN(d.getTime()) && d < now;
  };

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

  const displayedEvents = events.slice(0, displayedEventsCount);
  const hasMoreEvents = displayedEventsCount < events.length;

  const eventTypeColor = "#7d90c2ff";

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

  return (
    <Box sx={{ display: "flex", gap: 3 }}>
      {/* Left Sidebar - Filters */}
      <Box sx={{ width: 280, flexShrink: 0 }}>
        {/* Create Bazaar Button - Square shape above filters */}
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
          <Add />Create Bazaar
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
              placeholder="Search bazaars..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ color: "text.secondary", fontSize: "1.2rem", ml: 0.5 }} /></InputAdornment>,
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 8, height: 42, "& fieldset": { border: "none" }, "& input": { padding: "0", fontSize: "0.9rem" } } }}
            />
          </Paper>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>({events.length} bazaars)</Typography>
        </Box>

        {/* Bazaars List */}
        {loading && <Box display="flex" justifyContent="center" alignItems="center" mt={5}><CircularProgress /></Box>}
        {!loading && !events.length && <Typography color="text.secondary" mt={3} textAlign="center">No bazaars available.</Typography>}

        {!loading && events.length > 0 && (
          <>
            <Grid container spacing={3}>
              {displayedEvents.map((bazaar) => (
                <Grid size={{xs: 12, sm: 12, md: 6}} key={bazaar._id}>
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
                            <Chip 
                              label="Bazaar" 
                              size="small" 
                              sx={{ 
                                backgroundColor: `${eventTypeColor}12`, 
                                color: "black", 
                                fontWeight: 600, 
                                fontSize: "0.7rem", 
                                height: 22, 
                                borderRadius: 2 
                              }} 
                            />
                            {bazaar.isArchived && <Chip label="Archived" color="default" size="small" sx={{ height: 22 }} />}
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
                              lineHeight: 1.3
                            }}
                          >
                            {bazaar.name}
                          </Typography>
                        </Box>

                        {/* Icon and Menu Button - Top Right */}
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: "50%",
                              backgroundColor: eventTypeColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              flexShrink: 0,
                              fontSize: "1.3rem"
                            }}
                          >
                            <Store />
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenMenu(e, bazaar)}
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
                          {bazaar.location}
                        </Typography>
                      </Box>

                      {/* Event Details */}
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, mb: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <EventIcon sx={{ fontSize: "1rem", color: "text.secondary" }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(bazaar.start)} - {formatDate(bazaar.endDate || bazaar.start)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <AccessTime sx={{ fontSize: "1rem", color: "text.secondary" }} />
                          <Typography variant="body2" color="text.secondary">
                            {bazaar.time}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Organizer */}
                      {bazaar.ProfCreator && (
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
                            {bazaar.ProfCreator.firstName?.charAt(0)}{bazaar.ProfCreator.lastName?.charAt(0)}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {bazaar.ProfCreator.firstName} {bazaar.ProfCreator.lastName}
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
                          onClick={() => handleViewBazaar(bazaar)}
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
            minWidth: 160,
          }
        }}
      >
        <MenuItem onClick={() => handleOpenEditDialog(menuBazaar)}>
          <EditIcon sx={{ mr: 1.5, fontSize: 20 }} />
          Edit
        </MenuItem>
        {menuBazaar?.isArchived ? (
          <MenuItem onClick={() => handleOpenConfirmDialog('unarchive', menuBazaar!)}>
            <UnarchiveIcon sx={{ mr: 1.5, fontSize: 20 }} />
            Unarchive
        </MenuItem>
        ) : (
          <MenuItem onClick={() => handleOpenConfirmDialog('archive', menuBazaar!)}>
            <ArchiveIcon sx={{ mr: 1.5, fontSize: 20 }} />
            Archive
          </MenuItem>
        )}
        <Divider sx={{ my: 1 }} />
        <MenuItem 
          onClick={() => handleOpenConfirmDialog('delete', menuBazaar!)} 
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1.5, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Multi-step Create/Edit Form Dialog */}
      <CreateBazaarForm
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        bazaar={isEditMode ? selectedBazaar : undefined}
        onSuccess={handleFormSuccess}
      />

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.open} 
        onClose={confirmDialog.loading ? undefined : handleCloseConfirmDialog} 
        maxWidth="sm" 
        fullWidth
      >
        {confirmDialog.bazaar && (
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
                  {confirmDialog.bazaar.name}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOn sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Location:</strong> {confirmDialog.bazaar.location || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarToday sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Date:</strong> {formatDate(confirmDialog.bazaar.start)} - {formatDate(confirmDialog.bazaar.endDate || confirmDialog.bazaar.start)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AccessTime sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Time:</strong> {confirmDialog.bazaar.time || 'N/A'}
                    </Typography>
                  </Box>
                  {confirmDialog.bazaar.ProfCreator && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Business sx={{ fontSize: 18, color: "#64748b" }} />
                      <Typography variant="body2" sx={{ color: "#475569" }}>
                        <strong>Organizer:</strong> {confirmDialog.bazaar.ProfCreator.firstName} {confirmDialog.bazaar.ProfCreator.lastName}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarToday sx={{ fontSize: 18, color: "#64748b" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      <strong>Status:</strong> {confirmDialog.bazaar.isArchived ? 'Archived' : 'Active'}
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
                      ? "📁 This bazaar will be moved to archives and hidden from the main view."
                      : confirmDialog.actionType === 'unarchive'
                      ? "📂 This bazaar will be restored to the active list."
                      : "⚠️ This action is permanent and cannot be undone. All associated data will be deleted."}
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
                  'Archive Bazaar'
                ) : confirmDialog.actionType === 'unarchive' ? (
                  'Unarchive Bazaar'
                ) : (
                  'Delete Permanently'
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
                <Chip 
                  label="Bazaar" 
                  color="primary" 
                  size="small" 
                  sx={{ fontWeight: 600, fontSize: '0.75rem' }} 
                />
                {selectedBazaar?.isArchived && <Chip label="Archived" color="default" size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />}
              </Stack>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {selectedBazaar?.name}
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
              <Typography 
                variant="overline" 
                fontWeight={700} 
                color="primary.main" 
                gutterBottom
                sx={{ fontSize: '0.7rem' }}
              >
                Bazaar Information
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Box display="flex" alignItems="top">
                  <CalendarToday sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                  <Box display="flex" gap={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      DATES:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDateTime(selectedBazaar?.start || '')} - {formatDateTime(selectedBazaar?.endDate || selectedBazaar?.start || '')}
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
                      {selectedBazaar?.time}
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
                      {selectedBazaar?.location}
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
                sx={{ fontSize: '0.7rem' }}
              >
                Description
              </Typography>
              <Typography 
                variant="body2" 
                color="text.primary" 
                sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', mt: 1 }}
              >
                {selectedBazaar?.shortDescription || 'No description available.'}
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