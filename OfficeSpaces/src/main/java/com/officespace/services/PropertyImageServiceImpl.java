package com.officespace.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.officespace.daos.PropertyImageDao;
import com.officespace.entities.PropertyImage;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class PropertyImageServiceImpl {

	@Autowired
	private PropertyImageDao propertyImageDao;

	@Value("${app.upload.dir}")
	private String uploadDir;

	public void uploadImages(Integer propertyId, MultipartFile[] files) {
		try {
			Path uploadPath = Paths.get(uploadDir);
			Files.createDirectories(uploadPath);

			for (MultipartFile file : files) {
				String originalName = file.getOriginalFilename();
				String safeName = originalName != null
				        ? originalName.replaceAll("[^a-zA-Z0-9._-]", "_")
				        : "file";
				String fileName = System.currentTimeMillis() + "_" + safeName;

				Path filePath = uploadPath.resolve(fileName);
				Files.write(filePath, file.getBytes());

				PropertyImage image = new PropertyImage();
				image.setPropertyId(propertyId);
				image.setImageUrl("/images/" + fileName);
				propertyImageDao.save(image);
			}
		} catch (IOException e) {
			throw new RuntimeException("Failed to upload images", e);
		}
	}

	public List<PropertyImage> getImagesByPropertyId(int propertyId) {
		return propertyImageDao.findByPropertyId(propertyId);
	}

	public String deleteImage(int imageId) {
		PropertyImage image = propertyImageDao.findById(imageId).orElse(null);
		if (image != null) {
			if (image.getImageUrl() != null && image.getImageUrl().startsWith("/images/")) {
				String fileName = image.getImageUrl().substring("/images/".length());
				try {
					Path filePath = Paths.get(uploadDir).resolve(fileName);
					Files.deleteIfExists(filePath);
				} catch (IOException ignored) {}
			}
			propertyImageDao.deleteById(imageId);
		}
		return "Image deleted successfully";
	}
}