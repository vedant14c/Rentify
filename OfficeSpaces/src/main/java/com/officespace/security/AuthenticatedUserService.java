package com.officespace.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.officespace.entities.Role;
import com.officespace.entities.User;

@Service
public class AuthenticatedUserService {

    public User requireUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof User)) {
            throw new AccessDeniedException("Authentication is required.");
        }
        return (User) authentication.getPrincipal();
    }

    public User requireRole(Role role) {
        User user = requireUser();
        if (user.getRole() != role) {
            throw new AccessDeniedException("You are not authorized to perform this action.");
        }
        return user;
    }

    public User requireOwnerOrAdmin() {
        User user = requireUser();
        if (user.getRole() != Role.OWNER && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only property owners or administrators can perform this action.");
        }
        return user;
    }
}
