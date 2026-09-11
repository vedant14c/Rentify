package com.officespace.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserView {
    private Integer id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String preferredCity;
    private String preferredPropertyType;
    private String preferredListingType;
    private Double maxBudget;
    private Boolean isActive;
}