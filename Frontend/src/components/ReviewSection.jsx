import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiMessageSquare,
  FiSend,
  FiStar,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import {
  addReview,
  deleteReview,
  getReviewerProfile,
  getReviewsByPropertyId,
} from "../services/reviewService";
import "../css/reviewSection.css";

function getLoggedInUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user")
    );
  } catch {
    return null;
  }
}

function getReviewId(review) {
  return review.reviewId ?? review.id;
}

function getErrorMessage(error) {
  const responseData = error.response?.data;

  if (typeof responseData === "string") {
    return responseData;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (!error.response) {
    return "Cannot connect to the backend.";
  }

  return "Unable to complete the request.";
}

function formatReviewDate(date) {
  if (!date) {
    return "Recently added";
  }

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function ReviewSection({ propertyId }) {
  const token = localStorage.getItem("token");
  const currentUser = getLoggedInUser();

  const currentUserId = Number(
    currentUser?.userId ||
      currentUser?.id ||
      localStorage.getItem("userId")
  );

  const currentRole = String(
    currentUser?.role ||
      localStorage.getItem("role") ||
      ""
  ).toUpperCase();

  const [reviews, setReviews] = useState([]);
  const [reviewerNames, setReviewerNames] =
    useState({});

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] =
    useState(0);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getReviewsByPropertyId(propertyId);

      const reviewList = Array.isArray(response)
        ? response
        : [];

      const uniqueReviewsMap = new Map();
      reviewList.forEach((review) => {
        const key = review.reviewerId ?? getReviewId(review);
        if (
          !uniqueReviewsMap.has(key) ||
          getReviewId(review) > getReviewId(uniqueReviewsMap.get(key))
        ) {
          uniqueReviewsMap.set(key, review);
        }
      });
      const deduplicatedReviews = Array.from(uniqueReviewsMap.values());

      setReviews(deduplicatedReviews);

      const uniqueReviewerIds = [
        ...new Set(
          deduplicatedReviews.map(
            (review) => review.reviewerId
          )
        ),
      ];

      const reviewerEntries = await Promise.all(
        uniqueReviewerIds.map(async (reviewerId) => {
          try {
            const profile =
              await getReviewerProfile(reviewerId);

            return [
              reviewerId,
              profile?.name ||
                `User #${reviewerId}`,
            ];
          } catch {
            return [
              reviewerId,
              `User #${reviewerId}`,
            ];
          }
        })
      );

      setReviewerNames(
        Object.fromEntries(reviewerEntries)
      );
    } catch (requestError) {
      console.error(
        "Review loading error:",
        requestError
      );

      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const existingReview = useMemo(() => {
    if (!currentUserId || !reviews.length) {
      return null;
    }

    return reviews.find(
      (review) => Number(review.reviewerId) === currentUserId
    );
  }, [reviews, currentUserId]);

  useEffect(() => {
    if (existingReview) {
      setRating(Number(existingReview.rating || 0));
      setComment(existingReview.comment || "");
    } else {
      setRating(0);
      setComment("");
    }
  }, [existingReview]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }

    const ratingTotal = reviews.reduce(
      (total, review) =>
        total + Number(review.rating || 0),
      0
    );

    return ratingTotal / reviews.length;
  }, [reviews]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token || !currentUserId) {
      setError(
        "Please log in before submitting a review."
      );
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Please select a star rating.");
      return;
    }

    if (!comment.trim()) {
      setError("Please write your review.");
      return;
    }

    const isUpdating = Boolean(existingReview);

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      await addReview({
        propertyId,
        reviewerId: currentUserId,
        rating,
        comment,
      });

      setSuccessMessage(
        isUpdating
          ? "Your review was updated successfully."
          : "Your review was submitted successfully."
      );

      await loadReviews();
    } catch (requestError) {
      console.error(
        "Review submission error:",
        requestError
      );

      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (review) => {
    const reviewId = getReviewId(review);

    const confirmed = window.confirm(
      "Delete this review?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(reviewId);
      setError("");
      setSuccessMessage("");

      await deleteReview(reviewId);

      setReviews((previousReviews) =>
        previousReviews.filter(
          (item) =>
            getReviewId(item) !== reviewId
        )
      );

      if (Number(review.reviewerId) === currentUserId) {
        setRating(0);
        setHoverRating(0);
        setComment("");
      }

      setSuccessMessage(
        "Review deleted successfully."
      );
    } catch (requestError) {
      console.error(
        "Review deletion error:",
        requestError
      );

      setError(getErrorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  };

  const canDeleteReview = (review) => {
    return (
      Number(review.reviewerId) ===
        currentUserId ||
      currentRole === "ADMIN"
    );
  };

  return (
    <section className="review-section">
      <div className="review-section-heading">
        <div>
          <span className="review-section-label">
            <FiMessageSquare />
            CUSTOMER REVIEWS
          </span>

          <h2>Reviews and ratings</h2>

          <p>
            See what customers think about this
            workspace.
          </p>
        </div>

        <div className="review-rating-summary">
          <strong>
            {averageRating.toFixed(1)}
          </strong>

          <div>
            <span className="review-summary-stars">
              {[1, 2, 3, 4, 5].map(
                (star) => (
                  <FiStar
                    key={star}
                    className={
                      star <=
                      Math.round(averageRating)
                        ? "active"
                        : ""
                    }
                  />
                )
              )}
            </span>

            <small>
              Based on {reviews.length}{" "}
              {reviews.length === 1
                ? "review"
                : "reviews"}
            </small>
          </div>
        </div>
      </div>

      {error && (
        <div className="review-message error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="review-message success">
          <FiCheckCircle />
          {successMessage}
        </div>
      )}

      <div className="review-layout">
        <div className="review-list">
          {loading ? (
            <div className="review-empty">
              <FiMessageSquare />

              <h3>Loading reviews...</h3>
            </div>
          ) : reviews.length === 0 ? (
            <div className="review-empty">
              <FiMessageSquare />

              <h3>No reviews yet</h3>

              <p>
                Be the first person to review this
                workspace.
              </p>
            </div>
          ) : (
            reviews.map((review) => {
              const reviewId =
                getReviewId(review);

              const reviewerName =
                reviewerNames[
                  review.reviewerId
                ] ||
                `User #${review.reviewerId}`;

              return (
                <article
                  className="review-card"
                  key={reviewId}
                >
                  <div className="review-card-header">
                    <div className="review-user">
                      <span>
                        <FiUser />
                      </span>

                      <div>
                        <strong>
                          {reviewerName}
                        </strong>

                        <small>
                          {formatReviewDate(
                            review.createdAt
                          )}
                        </small>
                      </div>
                    </div>

                    {canDeleteReview(review) && (
                      <button
                        type="button"
                        className="review-delete-button"
                        onClick={() =>
                          handleDelete(review)
                        }
                        disabled={
                          deletingId === reviewId
                        }
                      >
                        <FiTrash2 />

                        {deletingId === reviewId
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    )}
                  </div>

                  <div className="review-card-stars">
                    {[1, 2, 3, 4, 5].map(
                      (star) => (
                        <FiStar
                          key={star}
                          className={
                            star <=
                            Number(review.rating)
                              ? "active"
                              : ""
                          }
                        />
                      )
                    )}
                  </div>

                  <p>{review.comment}</p>
                </article>
              );
            })
          )}
        </div>

        <aside className="review-form-card">
          <h3>
            {existingReview
              ? "Edit your review"
              : "Write a review"}
          </h3>

          <p>
            {existingReview
              ? "Update your existing rating and review below."
              : "Share your experience with this workspace."}
          </p>

          {!token ? (
            <div className="review-login-required">
              <FiUser />

              <p>
                Please log in to submit a review.
              </p>

              <Link to="/login">
                Login to Review
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>Your rating</label>

              <div
                className="review-rating-input"
                onMouseLeave={() =>
                  setHoverRating(0)
                }
              >
                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() =>
                        setHoverRating(star)
                      }
                      onClick={() =>
                        setRating(star)
                      }
                      aria-label={`${star} stars`}
                    >
                      <FiStar
                        className={
                          star <=
                          (hoverRating || rating)
                            ? "active"
                            : ""
                        }
                      />
                    </button>
                  )
                )}
              </div>

              <label htmlFor="review-comment">
                Your review
              </label>

              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) =>
                  setComment(event.target.value)
                }
                placeholder="Tell us about your experience..."
                rows="5"
                maxLength="500"
                required
              />

              <div className="review-character-count">
                {comment.length}/500
              </div>

              <button
                type="submit"
                className="review-submit-button"
                disabled={submitting}
              >
                <FiSend />

                {submitting
                  ? "Saving..."
                  : existingReview
                  ? "Update Review"
                  : "Submit Review"}
              </button>
            </form>
          )}
        </aside>
      </div>
    </section>
  );
}

export default ReviewSection;