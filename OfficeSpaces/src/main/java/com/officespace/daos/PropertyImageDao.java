package com.officespace.daos;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.officespace.entities.PropertyImage;

public interface PropertyImageDao extends JpaRepository<PropertyImage, Integer>{

	List<PropertyImage> findByPropertyId(int propertyId);
	
}
