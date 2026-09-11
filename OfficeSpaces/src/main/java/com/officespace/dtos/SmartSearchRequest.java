package com.officespace.dtos;

import lombok.Data;

@Data
public class SmartSearchRequest {

    private String query;

    private String city;

    private String propertyType;

    private String listingType;

    private Double minPrice;

    private Double maxPrice;

    private Double minArea;

}