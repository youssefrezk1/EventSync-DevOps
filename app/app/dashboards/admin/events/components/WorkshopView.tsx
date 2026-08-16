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
  Select,
  MenuItem,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Grid,
  Stack,
  Divider,
  Paper,
  Avatar,
} from "@mui/material";
import {
  Search,
  School,
  CalendarToday,
  EventBusy,
  LocationOn,
  AccessTime,
  People,
  Person,
  Close,
  AttachMoney,
  Event as EventIcon,
  Delete,
} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import { SearchFilters, useEvents, useUser } from "../../../../shared/services";
import { api } from "@/api";
import Link from "next/link";

export default function WorkshopView() {
  const [professorsList, setProfessorsList] = useState<any[]>([]);
  const [professorsLoading, setProfessorsLoading] = useState(true);
  const user = useUser();

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

  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    location: "",
    date: "",
    type: "",
    faculty: "",
    sortBy: "start",
    sortOrder: "asc",
    professorName: "",
  });
  const [displayedEventsCount, setDisplayedEventsCount] = useState(6);

  const { events, loading, error, fetchEvents, deleteWorkshop } = useEvents("workshops");
  
  // Delete dialog state
  const [selectedWorkshopToDelete, setSelectedWorkshopToDelete] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [multiStepDialogOpen, setMultiStepDialogOpen] = useState(false);

  useEffect(() => {
    fetchEvents(filters);
    fetchProfessors(); 
    setDisplayedEventsCount(6);
  }, [filters]);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoadMore = () => {
    setDisplayedEventsCount((prev) => prev + 6);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleOpenRegister = (workshop: any) => {
    setSelectedWorkshop(workshop);
    setMultiStepDialogOpen(true);
  };

  const handleViewDetails = (workshop: any) => {
    setSelectedWorkshop(workshop);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedWorkshop(null);
  };

  const handleRegistrationSuccess = () => {
    setStatusMsg({ 
      type: "success", 
      text: "Registration completed successfully!" 
    });
    fetchEvents(filters);
  };

  const displayedEvents = events.slice(0, displayedEventsCount);
  const hasMoreEvents = displayedEventsCount < events.length;

  const eventTypeColor = "#dbbbe2ff";

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
                search: "",
                location: "",
                date: "",
                type: "",
                faculty: "",
                sortBy: "start",
                sortOrder: "asc",
                professorName: ""
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

        {/* Date */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Date
          </Typography>
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
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Faculty
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.faculty}
              onChange={(e) => handleFilterChange("faculty", e.target.value)}
              displayEmpty
            >
              <MenuItem value="">All Faculties</MenuItem>
              <MenuItem value="MGT">MGT</MenuItem>
              <MenuItem value="BI">BI</MenuItem>
              <MenuItem value="MET">MET</MenuItem>
              <MenuItem value="IET">IET</MenuItem>
              <MenuItem value="EMS">EMS</MenuItem>
              <MenuItem value="CIVIL">CIVIL</MenuItem>
              <MenuItem value="ARCH">ARCH</MenuItem>
              <MenuItem value="AA">AA</MenuItem>
              <MenuItem value="PH/BIO">PH/BIO</MenuItem>
              <MenuItem value="LAW">LAW</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Professor Filter */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Professor
          </Typography>
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
                  <MenuItem key={index} value={prof}>
                    {prof}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  No professors available
                </MenuItem>
              )}
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
              <MenuItem value="start">Date</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="location">Location</MenuItem>
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
              placeholder="Search workshops..."
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
            ({events.length} workshops)
          </Typography>
        </Box>

        {/* Workshop Cards Grid */}
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

        {!loading && !error && events.length === 0 && (
          <Typography color="text.secondary" mt={3} textAlign="center">
            No workshops available.
          </Typography>
        )}

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
                              label="Workshop"
                              size="small"
                              sx={{
                                backgroundColor: `${eventTypeColor}12`,
                                color: "black",
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                height: 22,
                                borderRadius: 2,
                              }}
                            />
                            <Chip
                              label={workshop.facultyResponsible}
                              size="small"
                              sx={{
                                backgroundColor: `${eventTypeColor}12`,
                                color: "black",
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
                            {workshop.name}
                          </Typography>
                        </Box>

                        {/* Icon - Top Right */}
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
                            fontSize: "1.3rem",
                          }}
                        >
                          <School />
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
                            color: eventTypeColor,
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
                          {workshop.location}
                        </Typography>
                      </Box>

                      {/* Event Details */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.8,
                          mb: 1.5,
                        }}
                      >
                        <Box display={"flex"} gap={3}>
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
                              {formatDate(workshop.start)}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <AccessTime
                              sx={{
                                fontSize: "1rem",
                                color: "text.secondary",
                              }}
                            />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {formatTime(workshop.time)}
                            </Typography>
                          </Box>
                        </Box>

                        {workshop.requiredBudget && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <AttachMoney
                              sx={{
                                fontSize: "1rem",
                                color: eventTypeColor,
                              }}
                            />
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color={eventTypeColor}
                            >
                              {workshop.requiredBudget}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Organizer */}
                      {workshop.ProfCreator && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Avatar
                            sx={{ 
                              width: 24, 
                              height: 24,
                              backgroundColor: `${eventTypeColor}20`,
                              color: eventTypeColor,
                              fontSize: '0.7rem',
                              fontWeight: 700
                            }}
                          >
                            {workshop.ProfCreator.firstName?.charAt(0)}
                            {workshop.ProfCreator.lastName?.charAt(0)}
                          </Avatar>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {workshop.ProfCreator.firstName}{" "}
                            {workshop.ProfCreator.lastName}
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
                        {/* View Details Button */}
                        <Link href={`/workshop/${workshop._id}`} style={{ textDecoration: 'none', flex: 1 }}>
                        <Button
                          variant="outlined"
                          fullWidth
                          //onClick={() => handleViewDetails(workshop)}
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
                          View Details
                        </Button>
                        </Link>
                        
                        {/* Delete Button */}
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => {
                            setSelectedWorkshopToDelete(workshop);
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
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Load More Button */}
            {hasMoreEvents && (
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
                  label="Workshop"
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                />
                <Chip
                  label={selectedWorkshop?.facultyResponsible}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                />
              </Stack>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {selectedWorkshop?.name}
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
            {/* Organizer Information */}
            {selectedWorkshop?.ProfCreator && (
              <Box>
                <Typography
                  variant="overline"
                  fontWeight={700}
                  color="primary.main"
                  gutterBottom
                  sx={{ fontSize: "0.7rem" }}
                >
                  Organizer Information
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  <Box display="flex" alignItems="center">
                    <Avatar 
                      sx={{ 
                        width: 56, 
                        height: 56, 
                        mr: 2,
                        backgroundColor: `${eventTypeColor}20`,
                        color: eventTypeColor,
                        fontWeight: 700,
                        fontSize: '1rem'
                      }}
                    >
                      {selectedWorkshop.ProfCreator.firstName?.charAt(0)}
                      {selectedWorkshop.ProfCreator.lastName?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Prof. {selectedWorkshop.ProfCreator.firstName} {selectedWorkshop.ProfCreator.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Head Professor
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Box>
            )}

            {selectedWorkshop?.ProfCreator && <Divider />}

            <Box>
              <Typography
                variant="overline"
                fontWeight={700}
                color="primary.main"
                gutterBottom
                sx={{ fontSize: "0.7rem" }}
              >
                Workshop Information
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
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
                      START & END DATES:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDateTime(selectedWorkshop?.start || "")}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      -
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDateTime(selectedWorkshop?.end || "")}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="top">
                  <EventBusy
                    sx={{ mr: 1.5, color: "error.main", fontSize: 20 }}
                  />
                  <Box display="flex" gap={1}>
                    <Typography
                      variant="caption"
                      color="error.main"
                      fontWeight={600}
                    >
                      REGISTRATION DEADLINE:
                    </Typography>
                    <Typography variant="body2" fontWeight={500} color="error">
                      {formatDateTime(
                        selectedWorkshop?.registrationDeadline || ""
                      )}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="top">
                  <AccessTime
                    sx={{ mr: 1.5, color: "primary.main", fontSize: 20 }}
                  />
                  <Box display="flex" gap={1}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      TIME:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedWorkshop?.time}
                    </Typography>
                  </Box>
                </Box>

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
                      {selectedWorkshop?.location}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="top">
                  <People
                    sx={{ mr: 1.5, color: "primary.main", fontSize: 20 }}
                  />
                  <Box display="flex" gap={1}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      CAPACITY:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedWorkshop?.capacity} participants
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
                Description
              </Typography>
              <Typography
                variant="body2"
                color="text.primary"
                sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap", mt: 1 }}
              >
                {selectedWorkshop?.shortDescription ||
                  "No description available."}
              </Typography>
            </Box>

            {selectedWorkshop?.professorsParticipating &&
              selectedWorkshop.professorsParticipating.length > 0 && (
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
                      Professors Participating
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                      {selectedWorkshop.professorsParticipating.map(
                        (prof: string, idx: number) => (
                          <Chip
                            key={idx}
                            label={prof}
                            size="small"
                            variant="outlined"
                          />
                        )
                      )}
                    </Box>
                  </Box>
                </>
              )}

            {selectedWorkshop?.fullagenda && (
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
                    Full Agenda
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap", mt: 1 }}
                  >
                    {selectedWorkshop.fullagenda}
                  </Typography>
                </Box>
              </>
            )}

            {selectedWorkshop?.requiredBudget && (
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
          <Button
            onClick={() => {
              handleCloseDetails();
              handleOpenRegister(selectedWorkshop);
            }}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
            }}
          >
            Register
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setSelectedWorkshopToDelete(null); setDeleteError(''); }}
      >
        <DialogTitle>Delete Workshop</DialogTitle>
        <DialogContent>
          <Typography>
            {selectedWorkshopToDelete
              ? `Are you sure you want to delete the workshop "${selectedWorkshopToDelete.name || 'Unknown'}"?`
              : 'Are you sure you want to delete this workshop?'}
          </Typography>

          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setSelectedWorkshopToDelete(null); setDeleteError(''); }} disabled={deleteLoading}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!selectedWorkshopToDelete) return;
              try {
                setDeleteLoading(true);
                setDeleteError('');
                const result = await deleteWorkshop(selectedWorkshopToDelete._id);
                if (result.ok) {
                  await fetchEvents(filters);
                  setDeleteDialogOpen(false);
                  setSelectedWorkshopToDelete(null);
                } else {
                  setDeleteError(result.error || 'Failed to delete workshop');
                }
              } catch (err: any) {
                setDeleteError(err.message || 'Failed to delete workshop');
              } finally {
                setDeleteLoading(false);
              }
            }}
            variant="contained"
            color="error"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Multi-Step Registration Dialog would go here */}
      {selectedWorkshop && (
        <Dialog
          open={multiStepDialogOpen}
          onClose={() => setMultiStepDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            Register for {selectedWorkshop?.name}
            <IconButton
              onClick={() => setMultiStepDialogOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography>
              Registration dialog would go here...
            </Typography>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}