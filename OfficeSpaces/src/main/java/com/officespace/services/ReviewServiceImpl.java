package com.officespace.services;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.officespace.daos.ReviewDao;
import com.officespace.daos.UserDao;
import com.officespace.entities.Review;
import com.officespace.entities.Role;
import com.officespace.entities.User;

@Service
public class ReviewServiceImpl {

	private static final Logger logger = LoggerFactory.getLogger(ReviewServiceImpl.class);

	private final ReviewDao reviewDao;
	private final UserDao userDao;

	public ReviewServiceImpl(ReviewDao reviewDao, UserDao userDao) {
		this.reviewDao = reviewDao;
		this.userDao = userDao;
	}

	@Transactional
	public Review addReview(Review review) {
		Integer reviewerId = review.getReviewerId();
		try {
			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
			if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equalsIgnoreCase(authentication.getName())) {
				User user = userDao.findByEmail(authentication.getName());
				if (user != null) {
					reviewerId = user.getId();
				}
			}
		} catch (Exception e) {
			logger.warn("Could not retrieve user from SecurityContext: {}", e.getMessage());
		}

		if (reviewerId == null) {
			throw new IllegalArgumentException("Reviewer ID is required");
		}

		review.setReviewerId(reviewerId);

		logger.info("Executing addReview - Property ID: {}, Reviewer ID: {}", review.getPropertyId(), reviewerId);

		List<Review> propertyReviews = reviewDao.findByPropertyId(review.getPropertyId());
		Review existingReview = null;

		for (Review r : propertyReviews) {
			if (r.getReviewerId() != null && r.getReviewerId().equals(reviewerId)) {
				if (existingReview == null) {
					existingReview = r;
				} else {
					logger.warn("Deleting extra duplicate review ID {} for propertyId {} and reviewerId {}",
						r.getReviewId(), review.getPropertyId(), reviewerId);
					try {
						reviewDao.delete(r);
					} catch (Exception ex) {
						logger.warn("Failed to delete duplicate review record ID {}: {}", r.getReviewId(), ex.getMessage());
					}
				}
			}
		}

		if (existingReview != null) {
			logger.info("Existing review found (ID: {}). Updating review record.", existingReview.getReviewId());
			existingReview.setRating(review.getRating());
			existingReview.setComment(review.getComment());
			existingReview.setCreatedAt(LocalDateTime.now());
			return reviewDao.save(existingReview);
		} else {
			logger.info("No existing review found. Creating new review record.");
			review.setCreatedAt(LocalDateTime.now());
			return reviewDao.save(review);
		}
	}

	@Transactional
	public List<Review> getReviewsByPropertyId(int propertyId) {
		List<Review> reviews = reviewDao.findByPropertyId(propertyId);
		java.util.Map<Integer, Review> uniqueReviewsMap = new java.util.LinkedHashMap<>();
		java.util.List<Review> result = new java.util.ArrayList<>();

		for (Review r : reviews) {
			if (r.getReviewerId() != null) {
				if (uniqueReviewsMap.containsKey(r.getReviewerId())) {
					logger.info("Cleaning up pre-existing duplicate review ID: {} for reviewerId: {}", r.getReviewId(), r.getReviewerId());
					try {
						reviewDao.delete(r);
					} catch (Exception e) {
						logger.warn("Failed to delete duplicate review record: {}", e.getMessage());
					}
				} else {
					uniqueReviewsMap.put(r.getReviewerId(), r);
					result.add(r);
				}
			} else {
				result.add(r);
			}
		}

		return result;
	}

	public Review getReviewById(int id) {
		return reviewDao.findById(id).orElse(null);
	}

	@Transactional
	public String deleteReview(int id) {
		Review review = reviewDao.findById(id).orElse(null);
		if (review == null) return "Review not found";

		try {
			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
			if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equalsIgnoreCase(authentication.getName())) {
				User user = userDao.findByEmail(authentication.getName());
				if (user != null) {
					boolean isAdmin = user.getRole() == Role.ADMIN;
					boolean isReviewer = review.getReviewerId().equals(user.getId());

					if (!isAdmin && !isReviewer) {
						throw new AccessDeniedException("You can only delete your own reviews");
					}
				}
			}
		} catch (AccessDeniedException e) {
			throw e;
		} catch (Exception e) {
			logger.warn("Could not verify user authority on delete: {}", e.getMessage());
		}

		reviewDao.deleteById(id);
		return "Review deleted successfully";
	}
}