"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Rating,
  Paper,
  Fade,
  Modal,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Send,
  Close,
  Feedback,
  CheckCircle,
  AddComment,
  RateReview,
} from "@mui/icons-material";
import { api } from "../../../api";
import theme from "../../lib/theme";

interface Comment {
  _id: string;
  content: string;
  studentID?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  staffID?: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: string;
}

interface RatingData {
  _id: string;
  rating: number;
  StudentID?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  StaffID?: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: string;
}

interface AddCommentAndRatingProps {
  eventType: "trip" | "workshop" | "bazaar" | "conference" | "booth";
  eventId: string;
  eventName: string;
  userId?: string;
  userRole?: string;
  onSuccess?: () => void;
}

export default function AddCommentAndRating({
  eventType,
  eventId,
  eventName,
  userId,
  userRole,
  onSuccess,
}: AddCommentAndRatingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [ratingValue, setRatingValue] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [generalSuccess, setGeneralSuccess] = useState("");

  const [userHasCommented, setUserHasCommented] = useState(false);
  const [userHasRated, setUserHasRated] = useState(false);

  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  useEffect(() => {
    const checkIfRegistered = async () => {
      try {
        setCheckingRegistration(true);
        console.log("Checking registration for userId:", userId, "eventId:", eventId, "userRole:", userRole);

        const isStudentRole = userRole === "student" || userRole ==="admin" || userRole ==="event-office" || userRole ==="vendor";
        const endpoint = isStudentRole ? "/api/my-registrations" : "/api/my-registrations2";

        const response = await api.get(endpoint);
        const registrations = response.data.registrations || [];
        console.log(`userRole: ${userRole}, isStudentRole: ${isStudentRole}`);
        console.log(`Using endpoint: ${endpoint}`);
        console.log("Registrations response:", registrations);

        const isEventRegistered = registrations.some(
          (reg: any) => {
            console.log("Comparing reg.eventID:", reg.eventID, "with eventId:", eventId);
            return reg.eventID === eventId;
          }
        );

        console.log("Is event registered?", isEventRegistered);
        setIsRegistered(isEventRegistered);
      } catch (err: any) {
        console.error("Failed to check registration:", err);
        console.error("Error response:", err.response?.data);
        setIsRegistered(false);
      } finally {
        setCheckingRegistration(false);
      }
    };

    if (userId) {
      checkIfRegistered();
    }
  }, [eventId, userId, userRole]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserFeedbackStatus();
    }
  }, [isOpen, userId]);

  const getAuthorId = (item: Comment | RatingData): string => {
    if ("studentID" in item && item.studentID) {
      return item.studentID._id;
    } else if ("staffID" in item && item.staffID) {
      return item.staffID._id;
    } else if ("StudentID" in item && item.StudentID) {
      return item.StudentID._id;
    } else if ("StaffID" in item && item.StaffID) {
      return item.StaffID._id;
    }
    return "";
  };

  const fetchUserFeedbackStatus = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const [commentsResponse, ratingsResponse] = await Promise.all([
        api.get("/api/ratecomment/comments", {
          params: { eventType, eventId },
        }),
        api.get("/api/ratecomment/ratings", {
          params: { eventType, eventId },
        }),
      ]);

      const comments = commentsResponse.data.comments || [];
      const ratings = ratingsResponse.data.ratings || [];

      const userComment = comments.find((c: Comment) => getAuthorId(c) === userId);
      setUserHasCommented(!!userComment);

      const userRating = ratings.find((r: RatingData) => getAuthorId(r) === userId);
      setUserHasRated(!!userRating);
    } catch (err: any) {
      console.error("Failed to fetch feedback status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitBoth = async () => {
    const tryingToSubmitRating = ratingValue && ratingValue > 0;
    const tryingToSubmitComment = commentContent.trim();

    if (userHasRated && tryingToSubmitRating) {
      setGeneralError("You have already submitted a rating");
      return;
    }

    if (userHasCommented && tryingToSubmitComment) {
      setGeneralError("You have already submitted a comment");
      return;
    }

    if (!tryingToSubmitRating && !tryingToSubmitComment) {
      setGeneralError("Please provide a rating or comment");
      return;
    }

    try {
      setIsSubmitting(true);
      setGeneralError("");
      setGeneralSuccess("");

      const promises: Promise<any>[] = [];

      if (tryingToSubmitRating && !userHasRated) {
        promises.push(
          api.post("/api/ratecomment/rate", {
            eventType,
            eventId,
            rating: ratingValue,
          })
        );
      }

      if (tryingToSubmitComment && !userHasCommented) {
        promises.push(
          api.post("/api/ratecomment/comment", {
            eventType,
            eventId,
            content: commentContent,
          })
        );
      }

      await Promise.all(promises);

      setGeneralSuccess("Thank you for your feedback!");
      setCommentContent("");
      setRatingValue(null);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          setIsOpen(false);
        }, 1500);
      }

      setTimeout(() => {
        setGeneralSuccess("");
      }, 3000);
    } catch (err: any) {
      const status = err.response?.status;
      const errorMessage = err.response?.data?.message || err.message;

      if (status === 409 || errorMessage?.includes("already")) {
        setGeneralError("You have already submitted this feedback");
      } else if (status === 400) {
        setGeneralError("Invalid input. Please check your entries");
      } else if (status === 401) {
        setGeneralError("Please log in to submit feedback");
      } else if (status === 404) {
        setGeneralError("Event not found. Please refresh the page");
      } else if (status >= 500) {
        setGeneralError("Server error. Please try again later");
      } else {
        setGeneralError(errorMessage || "Unable to submit feedback");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCommentContent("");
    setRatingValue(null);
    setGeneralError("");
    setGeneralSuccess("");
  };

  const hasContent = (ratingValue && ratingValue > 0) || commentContent.trim();
  const allSubmitted = userHasCommented && userHasRated;
  const hasAvailableSection = !userHasRated || !userHasCommented;

  if (checkingRegistration) {
    return null;
  }

  if (!isRegistered) {
    return null;
  }

  return (
    <>
      <Button
  variant="contained"
  startIcon={<RateReview />}
  onClick={() => setIsOpen(true)}
  sx={{
    textTransform: "none",
    fontWeight: 600,
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
    boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
    px: 3,
    py: 1.5,
    borderRadius: "50px",
    "&:hover": {
      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      boxShadow: `0 6px 16px ${theme.palette.primary.main}60`,
      transform: "translateY(-2px)",
    },
    transition: "all 0.3s ease",
  }}
>
  Post Feedback
</Button>
      <Modal
        open={isOpen}
        onClose={handleClose}
        closeAfterTransition
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        }}
      >
        <Fade in={isOpen}>
          <Paper
            elevation={24}
            sx={{
              width: "100%",
              maxWidth: 450,
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
              background: `linear-gradient(to bottom, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            }}
          >
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                p: 2,
                pb: 2.5,
                position: "relative",
              }}
            >
              <IconButton
                onClick={handleClose}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: theme.palette.primary.contrastText,
                  backgroundColor: `${theme.palette.primary.contrastText}20`,
                  "&:hover": {
                    backgroundColor: `${theme.palette.primary.contrastText}30`,
                  },
                  padding: "6px",
                }}
              >
                <Close fontSize="small" />
              </IconButton>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.contrastText,
                  textAlign: "center",
                  letterSpacing: "-0.5px",
                }}
              >
                Share Your Experience
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255, 255, 255, 0.9)",
                  textAlign: "center",
                  mt: 0.5,
                  display: "block",
                }}
              >
                Help others by sharing your thoughts
              </Typography>
            </Box>

            <Box sx={{ p: 2, pt: 1.5 }}>
              {isLoading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress sx={{ color: theme.palette.primary.main }} />
                </Box>
              )}

              {!isLoading && allSubmitted && (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    px: 2,
                  }}
                >
                  <CheckCircle
                    sx={{
                      fontSize: 64,
                      color: theme.palette.success.main,
                      mb: 2,
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: 1,
                    }}
                  >
                    Thank You!
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      mb: 3,
                    }}
                  >
                    You've already submitted your feedback for this event
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleClose}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Close
                  </Button>
                </Box>
              )}

              {!isLoading && hasAvailableSection && (
                <>
                  {!userHasRated && (
                    <Box
                      sx={{
                        mb: 2,
                        textAlign: "center",
                        p: 2,
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mb: 1,
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          fontSize: "0.95rem",
                        }}
                      >
                        Rate Your Experience
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          mb: 1.5,
                          color: theme.palette.text.secondary,
                          display: "block",
                          fontSize: "0.75rem",
                        }}
                      >
                        Optional - Click on the stars
                      </Typography>
                      <Rating
                        value={ratingValue || null}
                        onChange={(event, newValue) => {
                          setRatingValue(newValue);
                          setGeneralError("");
                        }}
                        size="large"
                        emptyLabelText=""
                        sx={{
                          "& .MuiRating-iconFilled": {
                            color: theme.palette.warning.main,
                          },
                          "& .MuiRating-iconHover": {
                            color: theme.palette.warning.main,
                          },
                          "& .MuiRating-icon": {
                            transition: "transform 0.2s",
                          },
                          "& .MuiRating-iconFilled, & .MuiRating-iconHover": {
                            transform: "scale(1.1)",
                          },
                          fontSize: "2rem",
                          mb: 0.5,
                          "& .MuiRating-visuallyHidden": {
                            display: "none",
                          },
                        }}
                      />
                      {ratingValue && ratingValue > 0 && (
                        <Fade in={true}>
                          <Box
                            sx={{
                              mt: 1,
                              p: 0.75,
                              backgroundColor: `${theme.palette.success.main}15`,
                              border: `1px solid ${theme.palette.success.main}40`,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: theme.palette.success.main,
                                fontWeight: 600,
                              }}
                            >
                              {ratingValue === 1 && "Poor"}
                              {ratingValue === 2 && "Fair"}
                              {ratingValue === 3 && "Good"}
                              {ratingValue === 4 && "Very Good"}
                              {ratingValue === 5 && "Excellent"}
                            </Typography>
                          </Box>
                        </Fade>
                      )}
                    </Box>
                  )}

                  {!userHasCommented && (
                    <Box
                      sx={{
                        mb: 2,
                        p: 2,
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mb: 1,
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          fontSize: "0.95rem",
                        }}
                      >
                        Write Your Review
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          mb: 1.5,
                          color: theme.palette.text.secondary,
                          display: "block",
                          fontSize: "0.75rem",
                        }}
                      >
                        Optional - Share your thoughts and experiences
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={commentContent}
                        onChange={(e) => {
                          setCommentContent(e.target.value);
                          setGeneralError("");
                        }}
                        placeholder="What did you like? What could be improved?..."
                        inputProps={{ maxLength: 1000 }}
                        variant="outlined"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            backgroundColor: theme.palette.background.default,
                            fontSize: "0.9rem",
                            "&:hover": {
                              backgroundColor: theme.palette.background.paper,
                            },
                            "&.Mui-focused": {
                              backgroundColor: theme.palette.background.paper,
                            },
                            "& fieldset": {
                              borderColor: theme.palette.secondary.light,
                            },
                            "&:hover fieldset": {
                              borderColor: theme.palette.primary.light,
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: theme.palette.primary.main,
                              borderWidth: "2px",
                            },
                          },
                        }}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mt: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: "0.7rem",
                          }}
                        >
                          {commentContent.length > 0 ? "✓ " : ""}Your feedback is valuable
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              commentContent.length > 900
                                ? theme.palette.warning.main
                                : theme.palette.text.secondary,
                            fontWeight: commentContent.length > 900 ? 600 : 400,
                            fontSize: "0.7rem",
                          }}
                        >
                          {commentContent.length}/1000
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={handleClose}
                      size="medium"
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderWidth: 2,
                        borderColor: theme.palette.secondary.light,
                        color: theme.palette.text.secondary,
                        py: 1.2,
                        "&:hover": {
                          borderWidth: 2,
                          borderColor: theme.palette.secondary.main,
                          backgroundColor: theme.palette.background.default,
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Send fontSize="small" />}
                      onClick={handleSubmitBoth}
                      disabled={isSubmitting || !hasContent}
                      size="medium"
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        py: 1.2,
                        background: hasContent
                          ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
                          : undefined,
                        boxShadow: hasContent
                          ? `0 4px 12px ${theme.palette.primary.main}40`
                          : undefined,
                        "&:hover": {
                          background: hasContent
                            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                            : undefined,
                          boxShadow: hasContent
                            ? `0 6px 16px ${theme.palette.primary.main}60`
                            : undefined,
                        },
                        "&:disabled": {
                          background: theme.palette.secondary.light,
                          color: theme.palette.text.secondary,
                        },
                      }}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                  </Box>

                  {generalError && (
                    <Fade in={true}>
                      <Alert
                        severity="error"
                        sx={{
                          boxShadow: `0 2px 8px ${theme.palette.error.main}30`,
                        }}
                        onClose={() => setGeneralError("")}
                      >
                        {generalError}
                      </Alert>
                    </Fade>
                  )}
                  {generalSuccess && (
                    <Fade in={true}>
                      <Alert
                        severity="success"
                        sx={{
                          boxShadow: `0 2px 8px ${theme.palette.success.main}30`,
                        }}
                        onClose={() => setGeneralSuccess("")}
                      >
                        {generalSuccess}
                      </Alert>
                    </Fade>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Fade>
      </Modal>
    </>
  );
}