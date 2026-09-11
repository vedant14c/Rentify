import API from "./api";

export const addReview = async (reviewData) => {
  const response = await API.post("/reviews", {
    propertyId: Number(reviewData.propertyId),
    reviewerId: Number(reviewData.reviewerId),
    rating: Number(reviewData.rating),
    comment: reviewData.comment.trim(),
  });

  return response.data;
};

export const getReviewsByPropertyId = async (
  propertyId
) => {
  const response = await API.get(
    `/reviews/property/${propertyId}`
  );

  return response.data;
};

export const getReviewById = async (
  reviewId
) => {
  const response = await API.get(
    `/reviews/${reviewId}`
  );

  return response.data;
};

export const deleteReview = async (
  reviewId
) => {
  const response = await API.delete(
    `/reviews/${reviewId}`
  );

  return response.data;
};

export const getReviewerProfile = async (
  reviewerId
) => {
  const response = await API.get(
    `/users/${reviewerId}`
  );

  return response.data;
};