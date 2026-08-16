"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Divider,
  IconButton,
  Collapse,
  alpha,
} from '@mui/material';
import {
  Storefront as StorefrontIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  HowToVote as VoteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { RefreshCw } from 'lucide-react';
import BasicLayout from '@/components/layouts/basicLayout2';
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
import {LocalOffer} from "@mui/icons-material";
import BarChartIcon from "@mui/icons-material/BarChart";
import axios from 'axios';
import {
  // ... other imports
  EmojiEvents, // Add this import
} from "@mui/icons-material";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/eventOffice" },
  { text: "Events", icon: <EventIcon />, href: "/dashboards/eventOffice/events" },
  { text: "Tournaments", icon: <EmojiEvents />, href: "/dashboards/eventOffice/tournaments" }, // Add this line
  { text: "Gym", icon: <FitnessCenterIcon />, href: "/dashboards/eventOffice/gym" },
  { text: "Workshop Requests", icon: <WorkIcon />, href: "/dashboards/eventOffice/workshopRequests" },
  { text: "Vendor Requests", icon: <BusinessIcon />, href: "/dashboards/eventOffice/vendorRequests" },
  { text: "Reports", icon: <BarChartIcon />, href: "/dashboards/eventOffice/reports" },
  { text: "Overlapping Booths", icon: <StorefrontIcon />, href: "/dashboards/eventOffice/overlappingBooths" },
  { text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/eventOffice/loyaltyProgram"},
];

interface Vendor {
  _id: string;
  companyName: string;
  email: string;
  status: string;
}

interface Booth {
  _id: string;
  VendorID: Vendor;
  StartDate: string;
  EndDate: string;
  Location: string;
  BoothSize: '2x2' | '4x4';
  SetupDuration: '1 week' | '2 weeks' | '3 weeks' | '4 weeks';
  Pending: 'Pending' | 'Accept' | 'Reject';
  PaymentStatus: 'Unpaid' | 'Paid';
  createdAt: string;
}

interface PollEvent {
  booth: Booth;
  count: number;
  _id: string;
}

interface Poll {
  _id: string;
  Events: PollEvent[];
  createdAt: string;
  updatedAt: string;
}

interface OverlapGroup {
  id: string;
  overlapStart: Date;
  overlapEnd: Date;
  booths: Booth[];
  existingPoll?: Poll;
}

const OverlappingBoothsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [overlappingGroups, setOverlappingGroups] = useState<OverlapGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedPolls, setExpandedPolls] = useState<Set<string>>(new Set());

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchData();
  }, []);

  const togglePollExpansion = (groupId: string) => {
    setExpandedPolls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // ✅ FIXED: Use full URL like in reports page
      const [boothsRes, pollsRes] = await Promise.all([
        axios.get("http://localhost:4000/api/admin/participation-requests", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get("http://localhost:4000/api/booths/polls", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      console.log("Booths response:", boothsRes.data);
      console.log("Polls response:", pollsRes.data);
      
      if (boothsRes.data.success) {
        const booths = boothsRes.data.data.filter(
          (item: any): item is Booth => 'StartDate' in item && 'EndDate' in item
        );
        
        const polls = pollsRes.data.success ? pollsRes.data.data : [];
        const overlaps = findOverlappingBooths(booths, polls);
        setOverlappingGroups(overlaps);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error fetching data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const findPollForBooths = (boothIds: string[], polls: Poll[]): Poll | undefined => {
    const sortedBoothIds = [...boothIds].sort();
    
    for (const poll of polls) {
      const pollBoothIds = poll.Events.map(event => event.booth._id).sort();
      
      if (
        pollBoothIds.length === sortedBoothIds.length &&
        pollBoothIds.every((id, index) => id === sortedBoothIds[index])
      ) {
        return poll;
      }
    }
    
    return undefined;
  };

  const findOverlappingBooths = (booths: Booth[], polls: Poll[]): OverlapGroup[] => {
    const groups: OverlapGroup[] = [];
    const processed = new Set<string>();

    booths.forEach((booth, index) => {
      if (processed.has(booth._id)) return;

      const overlapping: Booth[] = [booth];
      const boothStart = new Date(booth.StartDate);
      const boothEnd = new Date(booth.EndDate);

      booths.forEach((otherBooth, otherIndex) => {
        if (index === otherIndex || processed.has(otherBooth._id)) return;

        const otherStart = new Date(otherBooth.StartDate);
        const otherEnd = new Date(otherBooth.EndDate);

        if (boothStart < otherEnd && boothEnd > otherStart) {
          overlapping.push(otherBooth);
        }
      });

      if (overlapping.length > 1) {
        overlapping.forEach(b => processed.add(b._id));
        
        const starts = overlapping.map(b => new Date(b.StartDate));
        const ends = overlapping.map(b => new Date(b.EndDate));
        const overlapStart = new Date(Math.max(...starts.map(d => d.getTime())));
        const overlapEnd = new Date(Math.min(...ends.map(d => d.getTime())));
        
        const boothIds = overlapping.map(b => b._id);
        const existingPoll = findPollForBooths(boothIds, polls);
        
        groups.push({
          id: `group-${groups.length}`,
          overlapStart,
          overlapEnd,
          booths: overlapping,
          existingPoll
        });
      }
    });

    return groups;
  };

  const formatDateRange = (start: Date | string, end: Date | string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const calculateDuration = (start: Date | string, end: Date | string): string => {
    const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreatePoll = async (group: OverlapGroup): Promise<void> => {
    try {
      const boothIds = group.booths.map(booth => booth._id);
      // ✅ FIXED: Use full URL like in reports page
      const response = await axios.post('http://localhost:4000/api/booths/poll', 
        { boothIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error creating poll:', err);
      alert('Failed to create poll. Please try again.');
    }
  };

  if (loading) {
    return (
      <BasicLayout menuItems={menuItems}>
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress size={60} sx={{ color: "#003d52", mb: 2 }} />
            <Typography variant="h6" color="#003d52">
              Loading overlapping booths...
            </Typography>
          </Box>
        </Box>
      </BasicLayout>
    );
  }

  if (error) {
    return (
      <BasicLayout menuItems={menuItems}>
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
          <Alert severity="error" sx={{ maxWidth: 500 }}>
            {error}
            <Button onClick={fetchData} sx={{ mt: 2 }} variant="contained">
              Retry
            </Button>
          </Alert>
        </Box>
      </BasicLayout>
    );
  }

  return (
    <BasicLayout menuItems={menuItems}>
      <Box sx={{ minHeight: "100vh" }}>
        {/* Hero Section */}
        <Box
          sx={{
            position: "relative",
            background:
              "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('https://images.unsplash.com/photo-1555421689-491a97ff2040?w=1600')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "320px",
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
              background: "linear-gradient(135deg, rgba(147, 199, 193, 0.1) 0%, rgba(0, 61, 82, 0.2) 100%)" 
            },
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1, px: 3, py: 3.5, width: "100%" }}>
            <Typography
              variant="h4"
              sx={{
                color: "white",
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: "2rem", md: "2.5rem" },
              }}
            >
              🏪 Overlapping Booths Management
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.9)",
                mb: 2,
                maxWidth: "700px",
                fontSize: "1rem",
                lineHeight: 1.5,
              }}
            >
              Manage booth conflicts and create polls for overlapping registrations
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshCw size={18} />}
              onClick={fetchData}
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

        {/* Content Area */}
        <Box sx={{  pb: 2, md: 4, px: { xs: 2, md: 2 } }}>
          {overlappingGroups.length === 0 ? (
            <Card
              sx={{
                p: 5,
                mx: -2,
                textAlign: "center",
                borderRadius: 3,
                border: "1px solid #e5e7eb",
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: alpha("#003d52", 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 1.5,
                }}
              >
                <StorefrontIcon sx={{ fontSize: 28, color: "#003d52" }} />
              </Box>
              <Typography variant="body1" fontWeight={700} color="#0F1724" mb={0.25}>
                No Overlapping Booths
              </Typography>
              <Typography variant="caption" color="text.secondary">
                There are currently no booth requests with overlapping dates.
              </Typography>
            </Card>
          ) : (
            <Stack spacing={1.5}>
              {overlappingGroups.map((group) => (
                <Card
                  key={group.id}
                  sx={{
                    mx: -2,
                    borderRadius: 3,
                    border: "1px solid #e5e7eb",
                    overflow: "hidden",
                    transition: "box-shadow 0.3s",
                    "&:hover": {
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", gap: 2.5, flexDirection: { xs: "column", md: "row" } }}>
                      {/* Left: Overlap Info & Booths */}
                      <Box sx={{ flex: 1 }}>
                        {/* Overlap Duration */}
                        <Box sx={{ mb: 2.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 2,
                                bgcolor: alpha("#003d52", 0.1),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <CalendarIcon sx={{ color: "#003d52", fontSize: 16 }} />
                            </Box>
                            <Typography variant="body2" fontWeight={700} color="#0F1724">
                              Overlapping Duration
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.primary" sx={{ ml: 5 }}>
                            {formatDateRange(group.overlapStart, group.overlapEnd)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 5, mt: 0.25, display: "block", fontSize: "0.7rem" }}>
                            Duration: {calculateDuration(group.overlapStart, group.overlapEnd)}
                          </Typography>
                        </Box>

                        {/* Booths List */}
                        <Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 2,
                                bgcolor: alpha("#93c7c1", 0.15),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <PeopleIcon sx={{ color: "#93c7c1", fontSize: 16 }} />
                            </Box>
                            <Typography variant="body2" fontWeight={700} color="#0F1724">
                              {group.booths.length} Booths Overlapping
                            </Typography>
                          </Box>
                          <Stack spacing={1} sx={{ ml: 5 }}>
                            {group.booths.map((booth) => (
                              <Box
                                key={booth._id}
                                sx={{
                                  p: 1,
                                  borderRadius: 2,
                                  bgcolor: "#f8fafc",
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                <Typography variant="caption" fontWeight={600} color="#0F1724">
                                  {booth.VendorID?.companyName || 'Unknown Vendor'}
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
                                  <Chip label={booth.Location} size="small" sx={{ height: 22 }} />
                                  <Chip label={booth.BoothSize} size="small" sx={{ height: 22 }} />
                                  <Chip label={booth.SetupDuration} size="small" sx={{ height: 22 }} />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", fontSize: "0.7rem" }}>
                                  {formatDateRange(booth.StartDate, booth.EndDate)}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Box>

                      <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />
                      <Divider sx={{ display: { xs: "block", md: "none" } }} />

                      {/* Right: Poll Status */}
                      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {group.existingPoll ? (
                          <PollDisplay
                            poll={group.existingPoll}
                            isExpanded={expandedPolls.has(group.id)}
                            onToggle={() => togglePollExpansion(group.id)}
                            formatDateTime={formatDateTime}
                          />
                        ) : (
                          <Box sx={{ width: "100%", maxWidth: 300, textAlign: "center" }}>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 3,
                                border: "2px dashed #cbd5e1",
                                bgcolor: "#f8fafc",
                              }}
                            >
                              <Box
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 2,
                                  bgcolor: alpha("#003d52", 0.1),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  mx: "auto",
                                  mb: 1,
                                }}
                              >
                                <VoteIcon sx={{ fontSize: 24, color: "#003d52" }} />
                              </Box>
                              <Typography variant="body2" fontWeight={700} color="#0F1724" mb={0.5}>
                                No Poll Created Yet
                              </Typography>
                              <Typography variant="caption" color="text.secondary" mb={1.5} sx={{ display: "block" }}>
                                Create a poll to let the community decide which booth should be approved
                              </Typography>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<VoteIcon />}
                                onClick={() => handleCreatePoll(group)}
                                sx={{
                                  px: 2.5,
                                  py: 0.75,
                                  borderRadius: 2,
                                  textTransform: "none",
                                  fontWeight: 600,
                                  fontSize: "0.875rem",
                                  bgcolor: "#003d52",
                                  "&:hover": {
                                    bgcolor: "#002a3a",
                                  },
                                }}
                              >
                                Create Poll
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {/* Summary */}
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Chip
              label={`Found ${overlappingGroups.length} group${overlappingGroups.length !== 1 ? 's' : ''} of overlapping booths`}
              sx={{
                bgcolor: "white",
                border: "1px solid #e5e7eb",
                fontWeight: 600,
                px: 1.5,
                py: 2,
                fontSize: "0.875rem",
              }}
            />
          </Box>
        </Box>
      </Box>
    </BasicLayout>
  );
};

// Poll Display Component
const PollDisplay: React.FC<{
  poll: Poll;
  isExpanded: boolean;
  onToggle: () => void;
  formatDateTime: (dateString: string) => string;
}> = ({ poll, isExpanded, onToggle, formatDateTime }) => {
  const totalVotes = poll.Events.reduce((sum, event) => sum + event.count, 0);
  const leadingEvent = poll.Events.reduce((max, event) =>
    event.count > max.count ? event : max, poll.Events[0]
  );

  const getPercentage = (count: number) => {
    return totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Compact View */}
      <Box
        onClick={onToggle}
        sx={{
          p: 2,
          borderRadius: 3,
          border: "2px solid #e2e8f0",
          bgcolor: "white",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": {
            borderColor: "#93c7c1",
            boxShadow: "0 2px 8px rgba(0, 61, 82, 0.08)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha("#003d52", 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <VoteIcon sx={{ color: "#003d52", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={700} color="#0F1724">
                Poll Active
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.75rem" }}>
                {totalVotes} total votes
              </Typography>
            </Box>
          </Box>
          <IconButton
            sx={{
              transition: "transform 0.3s ease",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        {totalVotes > 0 && (
          <Box sx={{ p: 1, bgcolor: "#f8fafc", borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.125, fontSize: "0.7rem" }}>
              Currently Leading
            </Typography>
            <Typography variant="caption" fontWeight={700} color="#003d52" sx={{ fontSize: "0.8rem" }}>
              {leadingEvent.booth.VendorID?.companyName || 'Unknown'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Expanded View */}
      <Collapse in={isExpanded} timeout={400}>
        <Box sx={{ mt: 1, p: 2, bgcolor: "white", borderRadius: 3, border: "1px solid #e2e8f0" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Typography variant="body2" fontWeight={700} color="#0F1724">
              Live Poll Results
            </Typography>
            <Chip
              label={`Updated ${formatDateTime(poll.updatedAt)}`}
              size="small"
              sx={{ bgcolor: "#f8fafc" }}
            />
          </Box>

          <Stack spacing={1}>
            {poll.Events.sort((a, b) => b.count - a.count).map((event, index) => {
              const percentage = getPercentage(event.count);
              const isLeading = event._id === leadingEvent._id && totalVotes > 0;

              return (
                <Box
                  key={event._id}
                  sx={{
                    position: "relative",
                    p: 1.5,
                    borderRadius: 2,
                    border: isLeading ? "2px solid #93c7c1" : "1px solid #e2e8f0",
                    bgcolor: isLeading ? alpha("#93c7c1", 0.05) : "#f8fafc",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        sx={{
                          bgcolor: isLeading ? "#93c7c1" : "#e2e8f0",
                          color: isLeading ? "white" : "#64748b",
                          fontWeight: 700,
                          height: 20,
                          fontSize: "0.75rem",
                        }}
                      />
                      <Typography variant="caption" fontWeight={600} sx={{ fontSize: "0.8rem" }}>
                        {event.booth.VendorID?.companyName || 'Unknown'}
                      </Typography>
                      {isLeading && (
                        <Chip
                          icon={<TrendingUpIcon sx={{ fontSize: 12 }} />}
                          label="Leading"
                          size="small"
                          sx={{
                            bgcolor: "#93c7c1",
                            color: "white",
                            fontWeight: 600,
                            height: 20,
                            fontSize: "0.7rem",
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={700} color={isLeading ? "#93c7c1" : "#0F1724"}>
                        {event.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                        {percentage}% of votes
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                      📍 {event.booth.Location}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                      📏 {event.booth.BoothSize}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
              <strong>{totalVotes}</strong> Total Votes • <strong>{poll.Events.length}</strong> Options
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
              Created {formatDateTime(poll.createdAt)}
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default OverlappingBoothsPage;