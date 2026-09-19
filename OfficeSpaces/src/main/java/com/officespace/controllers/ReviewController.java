package com.officespace.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.officespace.entities.Review;
import com.officespace.services.ReviewServiceImpl;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

	@Autowired
	private ReviewServiceImpl reviewServiceImpl;

	@PostMapping
	public Review addReview(@RequestBody Review review) {

		return reviewServiceImpl.addReview(review);
	}

	@GetMapping("/property/{propertyId}")
	public List<Review> getReviewsByPropertyId(@PathVariable int propertyId) {

		return reviewServiceImpl.getReviewsByPropertyId(propertyId);
	}

	@GetMapping("/{id}")
	public Review getReviewById(@PathVariable int id) {

		return reviewServiceImpl.getReviewById(id);
	}

	@DeleteMapping("/{id}")
	public String deleteReview(@PathVariable int id) {

		return reviewServiceImpl.deleteReview(id);
	}
}