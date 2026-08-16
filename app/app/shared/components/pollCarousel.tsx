// Replace your PollCarouselSection component with this enhanced version

"use client";

import React, { useState, useEffect } from 'react';
import { Ballot } from '@mui/icons-material';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Button,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  alpha,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  Paper,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  HowToVote,
  Close,
  EmojiEvents,
  CheckCircle,
} from '@mui/icons-material';
import { useTheme } from "@mui/material/styles";
import { api } from '@/api';

interface Vendor {
  _id: string;
  companyName: string;
  email: string;
}

interface Booth {
  _id: string;
  VendorID: Vendor;
  StartDate: string;
  EndDate: string;
  Location: string;
  BoothSize: '2x2' | '4x4';
  SetupDuration: string;
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
  userVotedFor?: string;
}

const PollCarouselSection: React.FC = () => {
  const theme = useTheme();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voting, setVoting] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await api.get('/api/booths/polls');
      
      if (res.data.success) {
        const fetchedPolls: Poll[] = res.data.data;
        setPolls(fetchedPolls);

        fetchedPolls.forEach(async (poll: Poll) => {
          const hasExpiredBooth = poll.Events.some(event => {
            const startDate = new Date(event.booth.StartDate);
            return startDate < new Date();
          });

          if (hasExpiredBooth) {
            try {
              await api.delete(`/api/booths/poll/${poll._id}`);
              setPolls(prev => prev.filter(p => p._id !== poll._id));
            } catch (deleteErr) {
              console.error(`Failed to delete expired poll ${poll._id}`, deleteErr);
            }
          }
        });
      }
    } catch (err) {
      console.error('Error fetching polls:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (isAnimating) return;
    setDirection('next');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % polls.length);
      setIsAnimating(false);
    }, 550);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setDirection('prev');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + polls.length) % polls.length);
      setIsAnimating(false);
    }, 550);
  };

  const handleVote = async (pollId: string, boothId: string): Promise<void> => {
    try {
      setVoting(pollId);
      const res = await api.post('/api/booths/poll/vote', { 
        pollId, 
        boothId 
      });
      
      if (res.data.success) {
        setPolls(prevPolls =>
          prevPolls.map(poll =>
            poll._id === pollId 
              ? { ...res.data.data, userVotedFor: boothId }
              : poll
          )
        );
      }
    } catch (err) {
      console.error('Error voting:', err);
    } finally {
      setVoting(null);
    }
  };

  const handleRemoveVote = async (pollId: string): Promise<void> => {
    const poll = polls.find(p => p._id === pollId);
    if (!poll || !poll.userVotedFor) return;

    try {
      setRemoving(pollId);
      const res = await api.delete(`/api/booths/poll/vote/${pollId}`);
      
      if (res.data.success) {
        setPolls(prevPolls =>
          prevPolls.map(p =>
            p._id === pollId 
              ? { 
                  ...res.data.data, 
                  userVotedFor: undefined,
                  Events: res.data.data.Events || p.Events
                }
              : p
          )
        );
      }
    } catch (err: any) {
      console.error('Error removing vote:', err);
      alert(err?.response?.data?.message || 'Failed to remove vote');
    } finally {
      setRemoving(null);
    }
  };

  const getPercentage = (count: number, total: number): number => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  const getLeadingBooth = (poll: Poll) => {
    if (poll.Events.length === 0) return null;
    return poll.Events.reduce((max, e) => e.count > max.count ? e : max, poll.Events[0]);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }

  if (polls.length === 0) return null;

  return (
    <Box sx={{ py: 6, bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
      <Container maxWidth="lg">
        {/* Single Container Box */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            bgcolor: 'white',
          }}
        >
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            minHeight: 450,
          }}>
            {/* LEFT SIDE - Static Image & Text */}
            <Box 
              sx={{ 
                position: 'relative',
                backgroundImage: 'url(/images/vote.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 3,
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(201, 210, 247, 0.85) 0%, rgba(158, 173, 177, 0.85) 100%)',
                  opacity:0.6,
                   filter: "brightness(0.1)",
                },
              }}
            >
              {/* Background Pattern */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                                    radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
                }}
              />

              {/* Content */}
              <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 4,
                    mx: 'auto',
                    animation: 'float 3s ease-in-out infinite',
                    '@keyframes float': {
                      '0%, 100%': { transform: 'translateY(0px)' },
                      '50%': { transform: 'translateY(-10px)' },
                    },
                  }}
                >
                  <HowToVote sx={{ fontSize: 40, color: 'white' }} />
                </Box>

                <Typography
                  variant="h2"
                  sx={{
                    color: 'white',
                    fontWeight: 800,
                    
                    textShadow: '2px 2px 8px rgba(0,0,0,0.2)',
                    fontSize: { xs: '2rem', md: '2.5rem' },
                  }}
                >
                  Your Voice Matters
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: 400,
                    maxWidth: 400,
                    mx: 'auto',
                    lineHeight: 1.6,
                    mb: 1,
                    fontSize: '1rem',
                  }}
                >
                  Shape the future of campus by voting for your favorite booths and vendors
                </Typography>

                <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" sx={{ gap: 2 }}>
                  <Box
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.25)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    Live Results
                  </Box>
                  <Box
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.25)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    {polls.length} Active Polls
                  </Box>
                </Stack>
              </Box>

              {/* Decorative Circles */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '10%',
                  left: '10%',
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  filter: 'blur(40px)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '15%',
                  right: '15%',
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  filter: 'blur(50px)',
                }}
              />
            </Box>

            {/* RIGHT SIDE - Poll Card Stack */}
            <Box 
              sx={{ 
                position: 'relative',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                p: 3,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                gap: 2,
              }}
            >
              {/* Left Arrow */}
              <IconButton
                onClick={handlePrev}
                disabled={isAnimating}
                sx={{
                  bgcolor: 'white',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    borderColor: theme.palette.primary.main,
                  },
                  '&:disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                <ChevronLeft sx={{ fontSize: 28 }} />
              </IconButton>

              {/* Counter - Top Center */}
              <Box sx={{ 
                position: 'absolute',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
              }}>
                <Typography variant="body2" fontWeight={700} color="text.secondary">
                  {currentIndex + 1} / {polls.length}
                </Typography>
              </Box>

              {/* Card Stack */}
              <Box sx={{ position: 'relative', width: '100%', maxWidth: 400, height: 380, flexShrink: 0 }}>
                {polls.map((poll, idx) => {
                  const position = (idx - currentIndex + polls.length) % polls.length;
                  const isVisible = position < 4;
                  
                  if (!isVisible) return null;

                  const totalVotesForCard = poll.Events.reduce((sum, e) => sum + e.count, 0);
                  const leadingBoothForCard = getLeadingBooth(poll);

                  // Animation styles
                  let animationStyle = {};
                  if (isAnimating && position === 0) {
                    if (direction === 'next') {
                      animationStyle = {
                        animation: 'slideOutLeft 0.55s cubic-bezier(0.45, 0, 0.55, 1) forwards',
                        '@keyframes slideOutLeft': {
                          '0%': {
                            transform: 'translateX(0) scale(1) rotateY(0deg)',
                            opacity: 1,
                            zIndex: 10,
                          },
                          '60%': {
                            transform: 'translateX(-60px) scale(0.94) rotateY(-12deg)',
                            opacity: 0.6,
                          },
                          '100%': {
                            transform: 'translateX(60px) translateY(60px) scale(0.88) rotateY(0deg) rotate(8deg)',
                            opacity: 0.2,
                            zIndex: 1,
                          },
                        },
                      };
                    } else {
                      animationStyle = {
                        animation: 'slideInFromRight 0.55s cubic-bezier(0.45, 0, 0.55, 1) forwards',
                        '@keyframes slideInFromRight': {
                          '0%': {
                            transform: 'translateX(60px) translateY(60px) scale(0.88) rotate(8deg)',
                            opacity: 0.2,
                            zIndex: 1,
                          },
                          '40%': {
                            transform: 'translateX(60px) scale(0.94) rotateY(12deg)',
                            opacity: 0.6,
                          },
                          '100%': {
                            transform: 'translateX(0) scale(1) rotateY(0deg)',
                            opacity: 1,
                            zIndex: 10,
                          },
                        },
                      };
                    }
                  } else if (isAnimating && position === polls.length - 1) {
                    // Card coming from the back to front
                    if (direction === 'next') {
                      animationStyle = {
                        animation: 'comeToFront 0.55s cubic-bezier(0.45, 0, 0.55, 1) forwards',
                        '@keyframes comeToFront': {
                          '0%': {
                            transform: `translateX(${(polls.length - 1) * 15}px) translateY(${(polls.length - 1) * 15}px) scale(${1 - (polls.length - 1) * 0.04}) rotate(${(polls.length - 1) * 2}deg)`,
                            opacity: 0.2,
                          },
                          '40%': {
                            transform: 'translateX(60px) scale(0.94) rotateY(12deg)',
                            opacity: 0.6,
                          },
                          '100%': {
                            transform: 'translateX(0) scale(1) rotateY(0deg)',
                            opacity: 1,
                          },
                        },
                      };
                    }
                  }

                  return (
                    <Box
                      key={poll._id}
                      sx={{
                        position: 'absolute',
                        left: `${position * 15}px`,
                        top: `${position * 15}px`,
                        right: `-${position * 15}px`,
                        bottom: `-${position * 15}px`,
                        zIndex: 10 - position,
                        opacity: position === 0 ? 1 : Math.max(0.2, 0.5 - position * 0.15),
                        transform: `scale(${1 - position * 0.04}) rotate(${position * 2}deg)`,
                        transition: isAnimating ? 'none' : 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: position === 0 ? 'auto' : 'none',
                        transformStyle: 'preserve-3d',
                        perspective: '1000px',
                        willChange: 'transform, opacity',
                        backfaceVisibility: 'hidden',
                        WebkitFontSmoothing: 'antialiased',
                        ...animationStyle,
                      }}
                    >
                      <Card
                        elevation={0}
                        sx={{
                          height: '100%',
                          borderRadius: 3,
                          border: `2px solid ${alpha(theme.palette.primary.main, position === 0 ? 0.2 : 0.1)}`,
                          bgcolor: 'white',
                          overflow: 'auto',
                          boxShadow: position === 0 
                            ? `0 20px 60px ${alpha(theme.palette.primary.main, 0.15)}`
                            : `0 10px 30px ${alpha(theme.palette.primary.main, 0.08)}`,
                          position: 'relative',
                          willChange: 'transform, opacity',
                          backfaceVisibility: 'hidden',
                          WebkitFontSmoothing: 'antialiased',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '200px',
                            height: '200px',
                            background: `radial-gradient(circle at top right, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 70%)`,
                            pointerEvents: 'none',
                            zIndex: 0,
                          },
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '150px',
                            height: '150px',
                            background: `radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 70%)`,
                            pointerEvents: 'none',
                            zIndex: 0,
                          },
                        }}
                      >
                        {/* Card Header */}
                        <Box
                          sx={{
                            position: 'relative',
                            zIndex: 1,
                            px: 3,
                            py: 2,
                            bgcolor: alpha(theme.palette.secondary.main, 0.04),
                            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Box display={"flex"} gap={1}>
                          <Ballot/>
                          <Typography variant="h6"  fontWeight={700} sx={{ fontSize: '1rem' }}>
                            Booth Poll #{idx + 1}
                          </Typography>
                          </Box>

                          
                        </Box>

                        {/* Card Content */}
                        <CardContent sx={{ p: 2, position: 'relative', zIndex: 1 }}>
                          <RadioGroup
                            value={poll.userVotedFor || ''}
                            onChange={(e) => handleVote(poll._id, e.target.value)}
                          >
                            <Stack spacing={1.5}>
                              {poll.Events.map((event) => {
                                const percentage = getPercentage(event.count, totalVotesForCard);
                                const isUserVote = poll.userVotedFor === event.booth._id;
                                const isLeading = leadingBoothForCard?._id === event._id && totalVotesForCard > 0;

                                return (
                                  <Box
                                    key={event._id}
                                    sx={{
                                      position: 'relative',
                                      borderRadius: 1.5,
                                      overflow: 'hidden',
                                      border: `2px solid`,
                                      borderColor: isUserVote 
                                        ? theme.palette.success.main
                                        : isLeading
                                        ? '#f9d9fcff'
                                        : alpha(theme.palette.primary.main, 0.1),
                                      bgcolor: 'white',
                                      transition: 'all 0.2s',
                                      cursor: voting === poll._id ? 'wait' : 'pointer',
                                      '&:hover': {
                                        borderColor: isUserVote 
                                          ? theme.palette.success.dark
                                          : isLeading
                                          ? '#fae4fcff'
                                          : alpha(theme.palette.primary.main, 0.3),
                                        transform: position === 0 ? 'translateX(4px)' : 'none',
                                      },
                                    }}
                                  >
                                    {/* Progress Bar */}
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: `${percentage}%`,
                                        bgcolor: isUserVote
                                          ? alpha(theme.palette.success.main, 0.12)
                                          : isLeading
                                          ? alpha('#eea8f5ff', 0.12)
                                          : alpha(theme.palette.secondary.main, 0.08),
                                        transition: 'width 0.6s ease',
                                      }}
                                    />

                                    {/* Content */}
                                    <FormControlLabel
                                      value={event.booth._id}
                                      control={
                                        <Radio
                                          disabled={voting === poll._id || position !== 0}
                                          sx={{
                                            color: alpha(theme.palette.primary.main, 0.3),
                                            '&.Mui-checked': {
                                              color: isUserVote ? 'success.main' : 'primary.main',
                                            },
                                          }}
                                        />
                                      }
                                      label={
                                        <Box sx={{ 
                                          display: 'flex', 
                                          justifyContent: 'space-between', 
                                          alignItems: 'center',
                                          width: '100%',
                                          pr: 2,
                                        }}>
                                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography 
                                              variant="body2" 
                                              fontWeight={isUserVote ? 700 : 600}
                                              sx={{ 
                                                color: isUserVote ? 'success.dark' : 'text.primary',
                                                fontSize: '0.9rem',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                              }}
                                            >
                                              {event.booth.VendorID?.companyName}
                                            </Typography>
                                            {isUserVote && (
                                              <Chip
                                                icon={<CheckCircle sx={{ fontSize: 12 }} />}
                                                label="Voted"
                                                size="small"
                                                sx={{
                                                  height: 20,
                                                  bgcolor: alpha(theme.palette.success.main, 0.15),
                                                  color: 'success.dark',
                                                  fontWeight: 700,
                                                  fontSize: '0.65rem',
                                                  '& .MuiChip-icon': {
                                                    fontSize: 12,
                                                  },
                                                }}
                                              />
                                            )}
                                            {isLeading && !isUserVote && (
                                              <Chip
                                                icon={<EmojiEvents sx={{ fontSize: 12 }} />}
                                                label="Lead"
                                                size="small"
                                                sx={{
                                                  height: 20,
                                                  bgcolor: alpha('#9c5ba2ff', 0.15),
                                                  color: 'warning.dark',
                                                  fontWeight: 700,
                                                  fontSize: '0.65rem',
                                                  '& .MuiChip-icon': {
                                                    fontSize: 12,
                                                  },
                                                }}
                                              />
                                            )}
                                          </Stack>
                                          <Typography 
                                            variant="body2" 
                                            fontWeight={700}
                                            sx={{ 
                                              color: isUserVote ? 'success.dark' : 'text.secondary',
                                              fontSize: '0.85rem',
                                              ml: 1,
                                            }}
                                          >
                                            {percentage}%
                                          </Typography>
                                        </Box>
                                      }
                                      sx={{
                                        position: 'relative',
                                        zIndex: 1,
                                        m: 0,
                                        py: 1.5,
                                        px: 2,
                                        width: '100%',
                                        '& .MuiFormControlLabel-label': {
                                          width: '100%',
                                        },
                                      }}
                                    />
                                  </Box>
                                );
                              })}
                            </Stack>
                          </RadioGroup>

                          {/* Voting Indicator */}
                          {voting === poll._id && position === 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2, gap: 1 }}>
                              <CircularProgress size={16} />
                              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                Submitting...
                              </Typography>
                            </Box>
                          )}

                          {/* Total Votes */}
                          {voting !== poll._id && position === 0 && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                display: 'block',
                                textAlign: 'center',
                                mt: 2,
                                fontWeight: 600,
                                fontSize: '0.85rem',
                              }}
                            >
                              {totalVotesForCard} {totalVotesForCard === 1 ? 'vote' : 'votes'} total
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Box>
                  );
                })}
              </Box>

              {/* Right Arrow */}
              <IconButton
                onClick={handleNext}
                disabled={isAnimating}
                sx={{
                  bgcolor: 'white',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    borderColor: theme.palette.primary.main,
                  },
                  '&:disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                <ChevronRight sx={{ fontSize: 28 }} />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PollCarouselSection;