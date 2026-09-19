package com.officespace.controllers;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.officespace.entities.PropertyImage;
import com.officespace.services.PropertyImageServiceImpl;

@RestController
@RequestMapping("/properties")
public class PropertyImageController {

	@Autowired
	private PropertyImageServiceImpl propertyImageServiceImpl;

	@PostMapping("/images/{id}")
	public ResponseEntity<String> uploadImages(@PathVariable Integer id, @RequestParam("files") MultipartFile[] files)
			throws IOException {

		propertyImageServiceImpl.uploadImages(id, files);

		return ResponseEntity.ok("Images Uploaded Successfully");
	}



	@GetMapping("/images/{id}")
	public List<PropertyImage> getImagesByPropertyId(@PathVariable int id) {

		return propertyImageServiceImpl.getImagesByPropertyId(id);
	}

	@DeleteMapping("/images/{imageId}")
	public String deleteImage(@PathVariable int imageId) {

		return propertyImageServiceImpl.deleteImage(imageId);
	}
}
