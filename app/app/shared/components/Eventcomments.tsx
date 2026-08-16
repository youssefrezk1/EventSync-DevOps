"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Chip,
  Modal,
  Fade,
  Paper,
} from "@mui/material";
import {
  Edit,
  Delete,
  Close,
  Star,
  Warning,
  ChevronRight,
  KeyboardArrowDown,
} from "@mui/icons-material";
import CancelIcon from "@mui/icons-material/Cancel";
import { api } from "../../../api";
import theme from "../../lib/theme";
import AddCommentAndRating from "../../shared/components/AddCommentAndRating";

interface Comment {
  _id: string;
  content: string;
  rating?: number;
  studentID?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  staffID?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface RatingData {
  _id: string;
  rating: number;
  StudentID?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  StaffID?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface CombinedReview {
  _id: string;
  type: 'comment' | 'rating' | 'both';
  content?: string;
  rating?: number;
  author: {
    name: string;
    email: string;
    role: string;
    id: string;
  };
  createdAt: string;
  updatedAt?: string;
  commentId?: string;
  ratingId?: string;
}

interface EventCommentsProps {
  eventType: "trip" | "workshop" | "bazaar" | "conference" | "booth";
  eventId: string;
  eventName: string;
  userRole?: string;
  userId?: string;
  onSuccess?: () => void;
}

export default function EventComments({
  eventType,
  eventId,
  eventName,
  userRole,
  userId,
  onSuccess,
}: EventCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [combinedReviews, setCombinedReviews] = useState<CombinedReview[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<CombinedReview | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRatingValue, setEditRatingValue] = useState(0);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingReview, setDeletingReview] = useState<CombinedReview | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [commentsResponse, ratingsResponse] = await Promise.all([
        api.get("/api/ratecomment/comments", {
          params: { eventType, eventId },
        }),
        api.get("/api/ratecomment/ratings", {
          params: { eventType, eventId },
        }),
      ]);

      const fetchedComments = commentsResponse.data.comments || [];
      const fetchedRatings = ratingsResponse.data.ratings || [];

      setComments(fetchedComments);
      setRatings(fetchedRatings);
      setAverageRating(parseFloat(ratingsResponse.data.averageRating) || 0);

      const combined = combineReviews(fetchedComments, fetchedRatings);
      setCombinedReviews(combined);
      setTotalReviews(combined.length);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404) {
        setError("Event not found");
      } else if (status === 401) {
        setError("Please log in to view reviews");
      } else if (status >= 500) {
        setError("Unable to load reviews. Please try again later");
      } else {
        setError(err.response?.data?.message || "Failed to load reviews");
      }
    } finally {
      setLoading(false);
    }
  };

  const combineReviews = (comments: Comment[], ratings: RatingData[]): CombinedReview[] => {
    const reviewMap = new Map<string, CombinedReview>();

    comments.forEach(comment => {
      const author = getCommentAuthor(comment);
      reviewMap.set(author.id, {
        _id: comment._id,
        type: 'comment',
        content: comment.content,
        author,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        commentId: comment._id,
      });
    });

    ratings.forEach(rating => {
      const author = getRatingAuthor(rating);
      const existing = reviewMap.get(author.id);

      if (existing) {
        existing.type = 'both';
        existing.rating = rating.rating;
        existing.ratingId = rating._id;
      } else {
        reviewMap.set(author.id, {
          _id: rating._id,
          type: 'rating',
          rating: rating.rating,
          author,
          createdAt: rating.createdAt,
          updatedAt: rating.updatedAt,
          ratingId: rating._id,
        });
      }
    });

    return Array.from(reviewMap.values()).sort((a, b) => {
      const aIsOwn = userId && a.author.id === userId;
      const bIsOwn = userId && b.author.id === userId;

      if (aIsOwn && !bIsOwn) return -1;
      if (!aIsOwn && bIsOwn) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  useEffect(() => {
    if (eventId && eventType && isClient) {
      const fetchInitialData = async () => {
        try {
          const [commentsResponse, ratingsResponse] = await Promise.all([
            api.get("/api/ratecomment/comments", {
              params: { eventType, eventId },
            }),
            api.get("/api/ratecomment/ratings", {
              params: { eventType, eventId },
            }),
          ]);

          setAverageRating(parseFloat(ratingsResponse.data.averageRating) || 0);
          
          const fetchedComments = commentsResponse.data.comments || [];
          const fetchedRatings = ratingsResponse.data.ratings || [];
          setComments(fetchedComments);
          setRatings(fetchedRatings);
          
          const combined = combineReviews(fetchedComments, fetchedRatings);
          setCombinedReviews(combined);
          setTotalReviews(combined.length);
        } catch (err) {
          // Silently fail
        }
      };

      fetchInitialData();
    }
  }, [eventId, eventType, isClient]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);

    if (diffDays < 30) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffMonths < 12) {
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    } else {
      const diffYears = Math.floor(diffMonths / 12);
      return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
    }
  };

  const getCommentAuthor = (comment: Comment) => {
    if (comment.studentID) {
      return {
        name: `${comment.studentID.firstName} ${comment.studentID.lastName}`,
        email: comment.studentID.email,
        role: "Student",
        id: comment.studentID._id,
      };
    } else if (comment.staffID) {
      return {
        name: `${comment.staffID.firstName} ${comment.staffID.lastName}`,
        email: comment.staffID.email,
        role: comment.staffID.role || "Staff",
        id: comment.staffID._id,
      };
    }
    return {
      name: "Unknown User",
      email: "",
      role: "Unknown",
      id: "",
    };
  };

  const getRatingAuthor = (rating: RatingData) => {
    if (rating.StudentID) {
      return {
        name: `${rating.StudentID.firstName} ${rating.StudentID.lastName}`,
        email: rating.StudentID.email,
        role: "Student",
        id: rating.StudentID._id,
      };
    } else if (rating.StaffID) {
      return {
        name: `${rating.StaffID.firstName} ${rating.StaffID.lastName}`,
        email: rating.StaffID.email,
        role: rating.StaffID.role || "Staff",
        id: rating.StaffID._id,
      };
    }
    return {
      name: "Unknown User",
      email: "",
      role: "Unknown",
      id: "",
    };
  };

  const isReviewOwner = (review: CombinedReview) => {
    if (!userId) return false;
    return review.author.id === userId;
  };

  const handleOpenEditDialog = (review: CombinedReview) => {
    setEditingReview(review);
    setEditContent(review.content || "");
    setEditRatingValue(review.rating || 0);
    setEditError("");
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingReview(null);
    setEditContent("");
    setEditRatingValue(0);
    setEditError("");
  };

  const handleEditReview = async () => {
    if (!editingReview) return;

    try {
      setEditLoading(true);
      setEditError("");

      const promises: Promise<any>[] = [];

      if (editingReview.commentId && editContent.trim()) {
        promises.push(
          api.patch("/api/ratecomment/comments", {
            commentId: editingReview.commentId,
            content: editContent,
          })
        );
      }

      if (editingReview.ratingId && editRatingValue > 0) {
        promises.push(
          api.patch("/api/ratecomment/rates", {
            ratingId: editingReview.ratingId,
            rating: editRatingValue,
          })
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        await fetchData();
        handleCloseEditDialog();
      }
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404) {
        setEditError("Review not found. It may have been deleted");
      } else if (status === 401) {
        setEditError("Session expired. Please log in again");
      } else if (status === 403) {
        setEditError("You don't have permission to edit this review");
      } else if (status >= 500) {
        setEditError("Server error. Please try again later");
      } else {
        setEditError(err.response?.data?.message || "Unable to save changes");
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenDeleteDialog = (review: CombinedReview) => {
    setDeletingReview(review);
    setDeleteError("");
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingReview(null);
    setDeleteError("");
  };

  const handleDeleteReview = async () => {
    if (!deletingReview) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");

      const promises: Promise<any>[] = [];

      if (deletingReview.commentId) {
        const endpoint = userRole === 'admin' 
          ? '/api/ratecomment/comment' 
          : '/api/ratecomment/own-comment';
        promises.push(
          api.delete(endpoint, {
            data: {
              commentId: deletingReview.commentId,
              eventType,
              eventId,
            },
          })
        );
      }

      if (deletingReview.ratingId && userRole !== 'admin') {
        promises.push(
          api.delete('/api/ratecomment/own-rate', {
            data: {
              ratingId: deletingReview.ratingId,
              eventType,
              eventId,
            },
          })
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        await fetchData();
        handleCloseDeleteDialog();
      }
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404) {
        setDeleteError("Review not found. It may have already been deleted");
      } else if (status === 401) {
        setDeleteError("Session expired. Please log in again");
      } else if (status === 403) {
        setDeleteError("You don't have permission to delete this review");
      } else if (status >= 500) {
        setDeleteError("Server error. Please try again later");
      } else {
        setDeleteError(err.response?.data?.message || "Unable to delete review");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[Math.round(r.rating) as keyof typeof distribution]++;
      }
    });
    return distribution;
  };

  const getMaxCount = () => {
    const distribution = getRatingDistribution();
    return Math.max(...Object.values(distribution), 1);
  };

  const toggleExpanded = () => {
    if (totalReviews > 0) {
      setIsReviewsExpanded(!isReviewsExpanded);
      if (!isReviewsExpanded) {
        fetchData();
      }
    }
  };

  return (
    <Card
      sx={{
        borderRadius: "24px",
        overflow: "hidden",
        bgcolor: "#ffffff",
        width: "100%",
        maxWidth: 1200,
        boxShadow: "0px 4px 20px rgba(0,0,0,0.08)",
        mb: 3,
      }}
    >
      <CardContent sx={{ p: 5 }}>
        <Box
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    mb: 3,
  }}
>
  <Typography
    onClick={toggleExpanded}
    sx={{
      fontSize: 32,
      fontWeight: 600,
      lineHeight: 1.2,
      cursor: totalReviews > 0 ? "pointer" : "default",
    }}
  >
    Ratings and reviews
  </Typography>

  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
    <AddCommentAndRating
      eventType={eventType}
      eventId={eventId}
      eventName={eventName}
      onSuccess={onSuccess}
      userRole={userRole}
      userId={userId}
    />
    
    {totalReviews > 0 && (
      <IconButton size="small" onClick={toggleExpanded}>
        {isReviewsExpanded ? <KeyboardArrowDown /> : <ChevronRight />}
      </IconButton>
    )}
  </Box>
</Box>
        {/* Show rating summary only when collapsed */}
{!isReviewsExpanded && (
  <Box sx={{ cursor: totalReviews > 0 ? "pointer" : "default" }} onClick={toggleExpanded}>
    {/* Rating Summary Section - Only visible when collapsed */}
    {isClient && (
      <Box sx={{ display: "flex", gap: 4, alignItems: "flex-start", width: "100%" }}>
        {/* Average Rating */}
        <Box sx={{ textAlign: "center", minWidth: "120px" }}>
          <Typography
            sx={{
              fontSize: "3.5rem",
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            {averageRating.toFixed(1)}
          </Typography>
          <Rating
            value={averageRating}
            readOnly
            precision={0.1}
            size="small"
            sx={{
              mt: 1,
              "& .MuiRating-iconFilled": {
                color: "#fbbf24",
              },
            }}
          />
          <Typography
            sx={{
              mt: 1,
              color: "#555",
              fontSize: 16,
            }}
          >
            {totalReviews} {totalReviews === 1 ? "REVIEW" : "REVIEWS"}
          </Typography>
        </Box>

        {/* Rating Distribution */}
        <Box sx={{ flex: 1 }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = getRatingDistribution()[star as keyof ReturnType<typeof getRatingDistribution>];
            const totalCount = ratings.length || 1;
            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;

            return (
              <Box
                key={star}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1,
                }}
              >
                <Typography
                  sx={{
                    minWidth: "20px",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#333",
                  }}
                >
                  {star}
                </Typography>
                <Star sx={{ fontSize: 16, color: "#fbbf24" }} />
                <Box
                  sx={{
                    flex: 1,
                    height: 6,
                    bgcolor: "#e8e8e8",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: `${percentage}%`,
                      height: "100%",
                      bgcolor: "#fbbf24",
                      transition: "width 0.4s ease",
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    minWidth: "35px",
                    color: "#666",
                    fontSize: 13,
                    textAlign: "right",
                  }}
                >
                  {percentage.toFixed(0)}%
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    )}
  </Box>
)}
        {/* Reviews List - Only shown when expanded */}
        {isClient && isReviewsExpanded && (
          <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
            {loading && (
              <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 4 }}>
                <CircularProgress 
                  sx={{
                    color: "#0067b8",
                    mb: 2,
                  }}
                  size={50}
                />
                <Typography sx={{ color: "#666", fontSize: 18, fontWeight: 500 }}>
                  Loading reviews...
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!loading && !error && combinedReviews && combinedReviews.length === 0 && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography sx={{ fontSize: 18, color: "#555" }}>
                  No reviews yet
                </Typography>
                <Typography sx={{ fontSize: 16, color: "#555", mt: 1 }}>
                  Be the first to share your experience!
                </Typography>
              </Box>
            )}

            {!loading && !error && combinedReviews && combinedReviews.length > 0 && (
              <Box 
                sx={{ 
                  display: "flex", 
                  flexDirection: "column",
                  gap: 2,
                  maxHeight: "500px",
                  overflowY: "scroll",
                  pr: 2,
                  "&::-webkit-scrollbar": {
                    width: "12px",
                  },
                  "&::-webkit-scrollbar-track": {
                    bgcolor: "#f5f5f5",
                    borderRadius: "10px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    bgcolor: "#bbb",
                    borderRadius: "10px",
                    border: "3px solid #f5f5f5",
                    "&:hover": {
                      bgcolor: "#888",
                    },
                  },
                }}
              >
                {combinedReviews.map((review) => {
                  const isOwner = isReviewOwner(review);
                  const canDelete = isOwner ||  (userRole === "admin" && review.commentId);

                  return (
                    <Card
                      key={review._id}
                      variant="outlined"
                      sx={{
                        position: "relative",
                        border: isOwner ? "2px solid #0067b8" : "1px solid #e0e0e0",
                        borderRadius: "12px",
                        flexShrink: 0,
                      }}
                    >
                      <CardContent>
                        {isOwner && (
                          <Chip
                            label="Your Review"
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              bgcolor: "#0067b8",
                              color: "white",
                              fontSize: "0.7rem",
                            }}
                          />
                        )}

                        {/* Review Header with User Name */}
                        <Typography
                          sx={{
                            fontSize: 18,
                            fontWeight: 600,
                            mb: 1,
                            pr: isOwner ? 12 : 0,
                          }}
                        >
                          {review.author.name}
                        </Typography>

                        {review.rating && (
                          <Rating
                            value={review.rating}
                            readOnly
                            size="small"
                            sx={{
                              mb: review.content ? 1 : 2,
                              "& .MuiRating-iconFilled": {
                                color: "#fbbf24",
                              },
                            }}
                          />
                        )}

                        {/* Review Content - Only show if there's a comment */}
                        {review.content ? (
                          <Typography
                            sx={{
                              fontSize: 16,
                              color: "#555",
                              mb: 2,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {review.content}
                          </Typography>
                        ) : (
                          review.rating && (
                            <Typography
                              sx={{
                                fontSize: 16,
                                color: "#999",
                                mb: 2,
                                fontStyle: "italic",
                              }}
                            >
                              No written review
                            </Typography>
                          )
                        )}

                        {/* Review Footer */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography sx={{ fontSize: 14, color: "#555" }}>
                            {review.author.name} • {formatDate(review.createdAt)}
                            {review.updatedAt && review.updatedAt !== review.createdAt && (
                              <>
                                {" "}
                                • <span style={{ fontStyle: "italic" }}>edited</span>
                              </>
                            )}
                          </Typography>

                          {/* Action buttons */}
                          {(isOwner || canDelete) && (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              {isOwner && (
                                <Button
                                  startIcon={<Edit />}
                                  onClick={() => handleOpenEditDialog(review)}
                                  sx={{
                                    textTransform: "none",
                                    fontSize: 16,
                                    color: "#0067b8",
                                    "&:hover": { bgcolor: "#e6f2ff" },
                                  }}
                                >
                                  Edit
                                </Button>
                              )}

                              {canDelete && (
                                <Button
                                  startIcon={<CancelIcon />}
                                  onClick={() => handleOpenDeleteDialog(review)}
                                  sx={{
                                    textTransform: "none",
                                    fontSize: 16,
                                    color: "#d13438",
                                    "&:hover": { bgcolor: "#fee" },
                                  }}
                                >
                                  Delete
                                </Button>
                              )}
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Modal
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
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
        <Fade in={editDialogOpen}>
          <Paper
            elevation={24}
            sx={{
              width: "100%",
              maxWidth: 500,
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
                onClick={handleCloseEditDialog}
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
                Edit Your Review
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
                Update your rating or comment
              </Typography>
            </Box>

      <Box sx={{ p: 2, pt: 1.5 }}>
        {editingReview?.ratingId && (
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
              Your Rating
            </Typography>
            <Rating
              value={editRatingValue}
              onChange={(event, newValue) => {
                setEditRatingValue(newValue || 0);
                setEditError("");
              }}
              size="large"
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
              }}
            />
            {editRatingValue > 0 && (
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
                  {editRatingValue === 1 && "Poor"}
                  {editRatingValue === 2 && "Fair"}
                  {editRatingValue === 3 && "Good"}
                  {editRatingValue === 4 && "Very Good"}
                  {editRatingValue === 5 && "Excellent"}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {editingReview?.commentId && (
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
              Your Comment
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={5}
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                setEditError("");
              }}
              placeholder="Share your thoughts and experiences..."
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
                Maximum 1000 characters
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: editContent.length > 900 ? theme.palette.warning.main : theme.palette.text.secondary,
                  fontWeight: editContent.length > 900 ? 600 : 400,
                  fontSize: "0.7rem",
                }}
              >
                {editContent.length}/1000
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleCloseEditDialog}
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
            onClick={handleEditReview}
            disabled={editLoading}
            size="medium"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              py: 1.2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
              boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
              "&:hover": {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                boxShadow: `0 6px 16px ${theme.palette.primary.main}60`,
              },
              "&:disabled": {
                background: theme.palette.secondary.light,
                color: theme.palette.text.secondary,
              },
            }}
          >
            {editLoading ? "Saving..." : "Save Changes"}
          </Button>
        </Box>

        {editError && (
          <Fade in={true}>
            <Alert
              severity="error"
              sx={{
                boxShadow: `0 2px 8px ${theme.palette.error.main}30`,
              }}
              onClose={() => setEditError("")}
            >
              {editError}
            </Alert>
          </Fade>
        )}
      </Box>
    </Paper>
  </Fade>
</Modal>

      {/* Delete Dialog */}
      {/* Delete Dialog */}
<Modal
  open={deleteDialogOpen}
  onClose={handleCloseDeleteDialog}
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
  <Fade in={deleteDialogOpen}>
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
          background: "linear-gradient(135deg, #d13438 0%, #e57373 100%)",
          p: 2,
          pb: 2.5,
          position: "relative",
        }}
      >
        <IconButton
          onClick={handleCloseDeleteDialog}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "white",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.3)",
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
            color: "white",
            textAlign: "center",
            letterSpacing: "-0.5px",
          }}
        >
          Delete Review
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
          This action cannot be undone
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", gap: 2.5, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "56px",
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "rgba(209, 52, 56, 0.1)",
            }}
          >
            <Warning sx={{ color: "#d13438", fontSize: "2rem" }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Are you sure?
            </Typography>
            <Typography
              sx={{
                fontSize: 15,
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
              }}
            >
              This review will be permanently deleted. This action cannot be undone.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleCloseDeleteDialog}
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
            onClick={handleDeleteReview}
            disabled={deleteLoading}
            size="medium"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              py: 1.2,
              background: "linear-gradient(135deg, #d13438 0%, #e57373 100%)",
              boxShadow: "0 4px 12px rgba(209, 52, 56, 0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #b81c29 0%, #d13438 100%)",
                boxShadow: "0 6px 16px rgba(209, 52, 56, 0.6)",
              },
              "&:disabled": {
                background: theme.palette.secondary.light,
                color: theme.palette.text.secondary,
              },
            }}
          >
            {deleteLoading ? "Deleting..." : "Delete Review"}
          </Button>
        </Box>

        {deleteError && (
          <Fade in={true}>
            <Alert
              severity="error"
              sx={{
                mt: 2,
                boxShadow: "0 2px 8px rgba(209, 52, 56, 0.3)",
              }}
              onClose={() => setDeleteError("")}
            >
              {deleteError}
            </Alert>
          </Fade>
        )}
      </Box>
    </Paper>
  </Fade>
</Modal>
    </Card>
  );
}