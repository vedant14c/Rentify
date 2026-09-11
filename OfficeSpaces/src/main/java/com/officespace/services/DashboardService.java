package com.officespace.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.officespace.daos.PropertyDao;
import com.officespace.daos.UserDao;
import com.officespace.dtos.AdminDashboardDto;
import com.officespace.entities.Role;

@Service
public class DashboardService {

    @Autowired
    private UserDao userDao;

    @Autowired
    private PropertyDao propertyDao;

    public AdminDashboardDto getDashboardStats() {

        AdminDashboardDto dto = new AdminDashboardDto();

        // User statistics
        dto.setTotalUsers(userDao.count());
        dto.setPropertyOwners(userDao.countByRole(Role.OWNER));
        dto.setRenters(userDao.countByRole(Role.USER));
        dto.setAdmins(userDao.countByRole(Role.ADMIN));

        // Property statistics
        dto.setTotalListings(propertyDao.count());
        dto.setPendingListings(propertyDao.countByApprovalStatus("PENDING"));
        dto.setApprovedListings(propertyDao.countByApprovalStatus("APPROVED"));
        dto.setRejectedListings(propertyDao.countByApprovalStatus("REJECTED"));

        return dto;
    }
}