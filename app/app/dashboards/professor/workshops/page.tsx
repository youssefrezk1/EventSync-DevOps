"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";

import {LocalOffer} from "@mui/icons-material"; 

import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import WorkIcon from "@mui/icons-material/Work";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { RefreshCw, Plus, Vote } from "lucide-react";
import { api } from "@/api";
import DataTable, { TableColumn } from "@/components/DataTable";
import { TextCell, StatusChip, SecondaryTextCell } from "@/components/TableComponents";
import { LocationOn, CalendarToday, People, School, AttachMoney } from "@mui/icons-material";
import WorkshopFormDialog from "@/shared/components/WorkshopFormDialog";
import AgendaPreview from "@/shared/components/AgendaView";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/professor" },
  { text: "Events", icon: <EventIcon />, href: "/dashboards/professor/events" },
  { text: "Registered events", icon: <EventIcon />, href: "/dashboards/professor/registeredEvents" },
  { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/professor/gym" },
  { text: "Workshops", icon: <WorkIcon />, href: "/dashboards/professor/workshops" },
  {text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/professor/loyaltyProgram"}
];

const defaultForm = {
  name: "",
  location: "GUC Cairo",
  start: "",
  end: "",
  shortDescription: "",
  fullagenda: "",
  facultyResponsible: "",
  professorsParticipating: [] as string[],
  requiredBudget: "",
  fundingSource: "GUC",
  extraRequiredResources: "",
  capacity: "",
  registrationDeadline: "",
};

interface Workshop {
  _id: string;
  name: string;
  location: string;
  start: string;
  end: string;
  shortDescription: string;
  fullagenda: string;
  facultyResponsible: string;
  professorsParticipating: string[];
  requiredBudget: number;
  fundingSource: string;
  extraRequiredResources: string;
  capacity: number;
  registeredCount: number;
  registrationDeadline: string;
  status: string;
  requestChange?: string;
}

export default function WorkshopPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [attendeesOpen, setAttendeesOpen] = useState(false);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState({ ...defaultForm });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/professor/workshops/mine");
      setWorkshops(res.data || []);
    } catch (err: any) {
      console.error("Error fetching workshops:", err);
      setSnackbar({
        open: true,
        message: "Failed to fetch workshops",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleViewDetails = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setDetailsOpen(true);
  };

  const handleViewAttendees = async (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setAttendeesOpen(true);
    setLoadingAttendees(true);
    try {
      const res = await api.get(`/api/professor/workshops/getworkshopattendees/${workshop._id}`);
      setAttendees(res.data || []);
    } catch (err) {
      console.error("Error fetching attendees:", err);
      setSnackbar({
        open: true,
        message: "Failed to fetch attendees",
        severity: "error",
      });
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleOpenEdit = (workshop: Workshop) => {
    setIsEdit(true);
    setEditingId(workshop._id);
    const toLocal = (d?: string | null) => {
      if (!d) return "";
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    };
    setForm({
      name: workshop.name || "",
      location: workshop.location || "GUC Cairo",
      start: toLocal(workshop.start),
      end: toLocal(workshop.end),
      shortDescription: workshop.shortDescription || "",
      fullagenda: workshop.fullagenda || "",
      facultyResponsible: workshop.facultyResponsible || "",
      professorsParticipating: workshop.professorsParticipating || [],
      requiredBudget: workshop.requiredBudget?.toString() ?? "",
      fundingSource: workshop.fundingSource || "GUC",
      extraRequiredResources: workshop.extraRequiredResources || "",
      capacity: workshop.capacity?.toString() ?? "",
      registrationDeadline: toLocal(workshop.registrationDeadline),
    });
    setActiveStep(0);
    setOpen(true);
  };

  const handleCreateNew = () => {
    setForm({ ...defaultForm });
    setIsEdit(false);
    setEditingId(null);
    setActiveStep(0);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setIsEdit(false);
    setEditingId(null);
    setActiveStep(0);
    setForm({ ...defaultForm });
  };

  const submitForm = async () => {
    try {
      const requiredFields = [
        "name", "location", "start", "end", "shortDescription", "fullagenda",
        "facultyResponsible", "requiredBudget", "fundingSource", "capacity", "registrationDeadline",
      ];
      for (const field of requiredFields) {
        if (!form[field as keyof typeof form]) {
          setSnackbar({
            open: true,
            message: `Please fill in the ${field.replace(/([A-Z])/g, " $1").toLowerCase()} field`,
            severity: "warning",
          });
          return;
        }
      }
      if (!form.professorsParticipating || form.professorsParticipating.length === 0) {
        setSnackbar({
          open: true,
          message: "Please specify at least one participating professor",
          severity: "warning",
        });
        return;
      }

      const payload = {
        ...form,
        start: new Date(form.start).toISOString(),
        end: new Date(form.end).toISOString(),
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
        capacity: Number(form.capacity),
        requiredBudget: Number(form.requiredBudget),
      };

      if (isEdit && editingId) {
        await api.put(`/api/professor/workshops/${editingId}`, payload);
        setSnackbar({
          open: true,
          message: "✨ Workshop updated successfully!",
          severity: "success",
        });
      } else {
        await api.post("/api/professor/workshops", payload);
        setSnackbar({
          open: true,
          message: "🎉 Workshop created successfully!",
          severity: "success",
        });
      }

      const res = await api.get("/api/professor/workshops/mine");
      setWorkshops(res.data || []);
      closeDialog();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || "Failed to save workshop. Please try again.",
        severity: "error",
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

 const workshopColumns: TableColumn<Workshop>[] = [
  {
    id: "name",
    label: "WORKSHOP NAME",
    width: "2fr",
    render: (workshop: Workshop) => (
      <Box>
        <TextCell text={workshop.name} fontWeight={600} />
        <SecondaryTextCell text={workshop.shortDescription} />
      </Box>
    ),
  },
  {
    id: "faculty",
    label: "FACULTY",
    width: "1.5fr",
    render: (workshop: Workshop) => (
      <Box>
        <TextCell text={workshop.facultyResponsible} />
        <SecondaryTextCell text={`${workshop.professorsParticipating.length} professors`} />
      </Box>
    ),
  },
  {
    id: "date",
    label: "START DATE",
    width: "1fr",
    render: (workshop: Workshop) => (
      <SecondaryTextCell text={new Date(workshop.start).toLocaleDateString()} />
    ),
  },
  {
    id: "capacity",
    label: "CAPACITY",
    width: "0.8fr",
    align: "center",
    render: (workshop: Workshop) => <TextCell text={workshop.capacity} fontWeight={600} />,
  },
  {
    id: "registered",
    label: "REGISTERED",
    width: "0.8fr",
    align: "center",
    render: (workshop: Workshop) => (
      <TextCell
        text={workshop.registeredCount}
        fontWeight={600}
        color={workshop.registeredCount >= workshop.capacity ? "#dc2626" : "#2563eb"}
      />
    ),
  },
  {
    id: "status",
    label: "STATUS",
    width: "1fr",
    align: "center",
    render: (workshop: Workshop) => (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        {workshop.requestChange && workshop.requestChange !== "" ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              bgcolor: "#fef3c7",
              color: "#ca8a04",
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontSize: "0.8125rem",
              fontWeight: 600,
            }}
          >
            <WarningAmberIcon sx={{ fontSize: 16 }} />
            <span>Change Requested</span>
          </Box>
        ) : (
          <StatusChip
            label={workshop.status}
            colorMap={{
              Approved: { bg: "#dcfce7", text: "#15803d" },
              Pending: { bg: "#fef3c7", text: "#ca8a04" },
              Rejected: { bg: "#fee2e2", text: "#dc2626" },
            }}
          />
        )}
      </Box>
    ),
  },
  {
    id: "details",
    label: "DETAILS",
    width: "0.8fr",
    align: "center",
    render: (workshop: Workshop) => (
      <Button
        size="small"
        variant="contained"
        onClick={() => handleViewDetails(workshop)}
        sx={{
          bgcolor: "#e0f2fe",
          color: "#003d52",
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.8125rem",
          px: 2,
          "&:hover": {
            bgcolor: "#749d98",
            color: "#FFFFFF",
          },
        }}
      >
        View
      </Button>
    ),
  },
  {
    id: "attendees",
    label: "ATTENDEES",
    width: "0.8fr",
    align: "center",
    render: (workshop: Workshop) => (
      <Button
        size="small"
        variant="contained"
        onClick={() => handleViewAttendees(workshop)}
        sx={{
          bgcolor: "#e0f2fe",
          color: "#003d52",
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.8125rem",
          px: 2,
          "&:hover": {
            bgcolor: "#749d98",
            color: "#FFFFFF",
          },
        }}
      >
        View
      </Button>
    ),
  },
  {
    id: "edit",
    label: "EDIT",
    width: "0.8fr",
    align: "center",
    render: (workshop: Workshop) => (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        {workshop.status === "Pending" ? (
          <IconButton
            size="small"
            onClick={() => handleOpenEdit(workshop)}
            sx={{
              bgcolor: "#ede9fe",
              color: "#7c3aed",
              width: 32,
              height: 32,
              "&:hover": {
                bgcolor: "#ddd6fe",
              },
            }}
          >
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
        ) : (
          <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>-</Typography>
        )}
      </Box>
    ),
  },
];

  return (
    <BasicLayout menuItems={menuItems}>
      <Box sx={{ minHeight: "100vh" }}>
        {/* Hero Section */}
<Box
  sx={{
    position: "relative",
    background:
      "linear-gradient(to bottom, rgba(0, 20, 40, 0), rgba(0, 61, 82, 0.0)), url('https://images.unsplash.com/photo-1758270704113-9fb2ac81788f')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    minHeight: "400px",
    display: "flex",
    alignItems: "center",
    mb: 4,
    borderRadius: 3,
    overflow: "hidden",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background:
        "linear-gradient(135deg, rgba(147, 199, 193, 0.1) 0%, rgba(0, 61, 82, 0.2) 100%)",
    },
  }}
>
  <Box sx={{ position: "relative", zIndex: 1, px: 4, py: 6, width: "100%" }}>
    <Typography
      variant="h3"
      sx={{
        color: "white",
        fontWeight: 700,
        mb: 2,
        fontSize: { xs: "2rem", md: "2.5rem" },
      }}
    >
      🎓 My Workshops
    </Typography>
    <Typography
      variant="body1"
      sx={{
        color: "rgba(255, 255, 255, 0.9)",
        mb: 3,
        maxWidth: "700px",
        fontSize: "1rem",
        lineHeight: 1.6,
      }}
    >
      Manage and track your workshops. Create new workshops, edit existing ones, and monitor registrations and attendance.
    </Typography>

    <Box sx={{ display: "flex", gap: 2 }}>
      <Button
        variant="contained"
        startIcon={<Plus size={18} />}
        onClick={handleCreateNew}
        sx={{
          px: 3,
          py: 1.25,
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.9375rem",
          bgcolor: "#0b5d87ff",
          "&:hover": {
            bgcolor: "#08244fff",
          },
        }}
      >
        Create Workshop
      </Button>
      <Button
        variant="outlined"
        startIcon={<RefreshCw size={18} />}
        onClick={fetchWorkshops}
        disabled={loading}
        sx={{
          px: 3,
          py: 1.25,
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.9375rem",
          borderColor: "rgba(255, 255, 255, 0.5)",
          color: "white",
          "&:hover": {
            borderColor: "white",
            bgcolor: "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        Refresh
      </Button>
    </Box>
  </Box>
</Box>

        {/* Table Section */}
        <Box sx={{ px: 4, pb: 4 }}>
          <Box sx={{ mx: -4 }}>
            <DataTable
              columns={workshopColumns}
              data={workshops}
              loading={loading}
              emptyMessage="No workshops created yet"
              keyExtractor={(workshop: Workshop) => workshop._id}
              horizontalPadding={4}
            />
          </Box>
        </Box>

        {/* Create/Edit Workshop Dialog */}
        <WorkshopFormDialog
          open={open}
          onClose={closeDialog}
          isEdit={isEdit}
          form={form}
          setForm={setForm}
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          onSubmit={submitForm}
        />

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle
            sx={{
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "#f0fdf4",
              borderBottom: "2px solid #bbf7d0",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  bgcolor: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                <WorkIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#166534" }}>
                  Workshop Details
                </Typography>
                <Typography variant="caption" sx={{ color: "#16a34a" }}>
                  {selectedWorkshop?.name}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDetailsOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 4, py: 3 }}>
            {selectedWorkshop && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box sx={{ p: 3, bgcolor: "#f8fafc", borderRadius: 2, border: "2px solid #e2e8f0" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Basic Information
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOn sx={{ fontSize: 18, color: "#64748b" }} />
                      <Typography variant="body2" sx={{ color: "#475569" }}>
                        <strong>Location:</strong> {selectedWorkshop.location}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarToday sx={{ fontSize: 18, color: "#64748b" }} />
                      <Typography variant="body2" sx={{ color: "#475569" }}>
                        <strong>Start:</strong> {formatDateTime(selectedWorkshop.start)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarToday sx={{ fontSize: 18, color: "#64748b" }} />
                      <Typography variant="body2" sx={{ color: "#475569" }}>
                        <strong>End:</strong> {formatDateTime(selectedWorkshop.end)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <School sx={{ fontSize: 18, color: "#64748b" }} />
                      <Typography variant="body2" sx={{ color: "#475569" }}>
                        <strong>Faculty:</strong> {selectedWorkshop.facultyResponsible}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <People sx={{ fontSize: 18, color: "#64748b" }} />
                      <Typography variant="body2" sx={{ color: "#475569" }}>
                        <strong>Capacity:</strong> {selectedWorkshop.capacity} |{" "}
                        <strong>Registered:</strong> {selectedWorkshop.registeredCount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AttachMoney sx={{ fontSize: 18, color: "#64748b" }} />
                      <Typography variant="body2" sx={{ color: "#475569" }}>
                        <strong>Budget:</strong> ${selectedWorkshop.requiredBudget} ({selectedWorkshop.fundingSource})
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Full Agenda
                  </Typography>
                  <AgendaPreview
                    agendaJson={selectedWorkshop.fullagenda}
                    startDateTime={selectedWorkshop.start}
                    endDateTime={selectedWorkshop.end}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Participating Professors
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {selectedWorkshop.professorsParticipating.map((prof: string, idx: number) => (
                      <Box
                        key={idx}
                        sx={{
                          px: 2,
                          py: 0.5,
                          bgcolor: "#ede9fe",
                          color: "#7c3aed",
                          borderRadius: 2,
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                        }}
                      >
                        {prof}
                      </Box>
                    ))}
                  </Box>
                </Box>

                {selectedWorkshop.requestChange && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "#fef3c7",
                      borderLeft: "4px solid #ca8a04",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#ca8a04", mb: 0.5 }}>
                      Change Request
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#854d0e" }}>
                      {selectedWorkshop.requestChange}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Attendees Dialog */}
        <Dialog open={attendeesOpen} onClose={() => setAttendeesOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle
            sx={{
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "#f0f9ff",
              borderBottom: "2px solid #bae6fd",
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#075985" }}>
                Workshop Attendees
              </Typography>
              <Typography variant="caption" sx={{ color: "#0284c7" }}>
                {loadingAttendees ? "Loading..." : `${attendees.length} registered`}
              </Typography>
            </Box>
            <IconButton onClick={() => setAttendeesOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 3, py: 3 }}>
            {loadingAttendees ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : attendees.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {attendees.map((reg: any, idx: number) => {
                  const attendee = reg.attendee;
                  if (!attendee) return null;
                  return (
                    <Box
                      key={idx}
                      sx={{
                        p: 2,
                        bgcolor: "#f8fafc",
                        borderRadius: 2,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {attendee.firstName} {attendee.lastName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem" }}>
                        <strong>Email:</strong> {attendee.email}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem" }}>
                        <strong>ID:</strong> {attendee.studentId || attendee.staffId}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" sx={{ color: "#64748b", mb: 1 }}>
                  No attendees yet
                </Typography>
                <Typography sx={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                  Attendees will appear here once they register
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Snackbar for Success/Error Messages */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={{
            "& .MuiSnackbarContent-root": {
              minWidth: "300px",
            },
          }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{
              width: "100%",
              fontSize: "0.9375rem",
              fontWeight: 500,
              boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)",
              alignItems: "center",
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </BasicLayout>
  );
}