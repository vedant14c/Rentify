package com.officespace.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDto {

    private long totalUsers;
    private long propertyOwners;
    private long renters;
    private long admins;

    private long totalListings;
    private long pendingListings;
    private long approvedListings;
    private long rejectedListings;

    // Generate getters and setters
}