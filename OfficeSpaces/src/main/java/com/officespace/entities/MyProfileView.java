package com.officespace.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MyProfileView {
    private Integer id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String preferredCity;
    private String preferredPropertyType;
    private String preferredListingType;
    private Double maxBudget;
}