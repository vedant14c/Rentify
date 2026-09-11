package com.officespace.daos;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.officespace.entities.Review;

public interface ReviewDao extends JpaRepository<Review, Integer> {

    List<Review> findByPropertyId(int propertyId);

    @Query("SELECT r FROM Review r WHERE r.propertyId = :propertyId AND r.reviewerId = :reviewerId ORDER BY r.reviewId ASC")
    List<Review> findByPropertyIdAndReviewerId(@Param("propertyId") Integer propertyId, @Param("reviewerId") Integer reviewerId);
}