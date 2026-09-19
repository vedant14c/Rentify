package com.officespace.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.officespace.entities.Role;
import com.officespace.services.UserServiceImpl;

import com.officespace.dtos.AdminDashboardDto;
import com.officespace.services.DashboardService;
import com.officespace.daos.UserDao;
import com.officespace.dtos.AdminUserView;
import com.officespace.dtos.PublicUserView;
import com.officespace.entities.MyProfileView;
import com.officespace.entities.User;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserDao userDao;
    @Autowired
    private DashboardService dashboardService;
    @Autowired
    private UserServiceImpl userService;
    
    @GetMapping("/{id}")
    public PublicUserView getPublicProfile(@PathVariable int id) {
        User user = userDao.findById(id).orElse(null);
        if (user == null) return null;
        return new PublicUserView(user.getId(), user.getName(), user.getPhone());
    }
    @GetMapping("/me")
    public MyProfileView getMyProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        User user = userDao.findByEmail(authentication.getName());
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found for token");
        }

        return new MyProfileView(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole() != null ? user.getRole().name() : "USER",
                user.getPreferredCity(),
                user.getPreferredPropertyType(),
                user.getPreferredListingType(),
                user.getMaxBudget());
    }

    @PutMapping("/me/preferences")
    public MyProfileView updatePreferences(@RequestBody MyProfileView prefs) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        User user = userDao.findByEmail(authentication.getName());
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found for token");
        }

        if (prefs.getName() != null && !prefs.getName().isBlank()) {
            user.setName(prefs.getName().trim());
        }
        if (prefs.getPhone() != null) {
            user.setPhone(prefs.getPhone());
        }
        if (prefs.getPreferredCity() != null) {
            user.setPreferredCity(prefs.getPreferredCity());
        }
        if (prefs.getPreferredPropertyType() != null) {
            user.setPreferredPropertyType(prefs.getPreferredPropertyType());
        }
        if (prefs.getPreferredListingType() != null) {
            user.setPreferredListingType(prefs.getPreferredListingType());
        }
        if (prefs.getMaxBudget() != null) {
            user.setMaxBudget(prefs.getMaxBudget());
        }

        userDao.save(user);

        return getMyProfile();
    }
    
    @GetMapping
    public List<AdminUserView> getAllUsers() {
        return userDao.findAll().stream()
                .filter(u -> u.getRole() != Role.ADMIN)
        		.map(u -> new AdminUserView(
        		        u.getId(),
        		        u.getName(),
        		        u.getEmail(),
        		        u.getPhone(),
        		        u.getRole().name(),
        		        u.getPreferredCity(),
        		        u.getPreferredPropertyType(),
        		        u.getPreferredListingType(),
        		        u.getMaxBudget(),
        		        u.getIsActive()))
                .toList();
    }
    
    @GetMapping("/dashboard")
    public AdminDashboardDto getDashboardStats() {
        return dashboardService.getDashboardStats();
    }
    
    @PutMapping("/activate/{id}")
    public User activateUser(@PathVariable int id) {
        return userService.activateUser(id);
    }

    @PutMapping("/deactivate/{id}")
    public User deactivateUser(@PathVariable int id) {
        return userService.deactivateUser(id);
    }

    @PutMapping("/{id}/role")
    public User updateUserRole(@PathVariable int id, @RequestParam Role role) {
        return userService.updateUserRole(id, role);
    }
    
    @PutMapping("/me/fcm-token")
    public ResponseEntity<?> updateFcmToken(
            @RequestParam String token,
            Authentication authentication) {

    	System.out.println("🔥 FCM API HIT");
        System.out.println("Token = " + token);
        
        System.out.println("========== UPDATE FCM ==========");
        System.out.println("Authentication = " + authentication);
        System.out.println("Email = " + (authentication != null ? authentication.getName() : "NULL"));
        System.out.println("Token = " + token);

        if (authentication == null) {
            return ResponseEntity.badRequest().body("Authentication is NULL");
        }
        String email = authentication.getName();

        userService.updateFcmToken(authentication.getName(), token);

        return ResponseEntity.ok("FCM Token Updated");
    }
}