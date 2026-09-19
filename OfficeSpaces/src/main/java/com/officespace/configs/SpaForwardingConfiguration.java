package com.officespace.configs;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardingConfiguration {

    @GetMapping({
            "/",
            "/offices",
            "/office-details/{id}",
            "/login",
            "/register",
            "/forgot-password",
            "/reset-password",
            "/book/{id}",
            "/book-office/{id}",
            "/my-bookings",
            "/favorites",
            "/profile",
            "/list-property",
            "/owner-dashboard",
            "/edit-property/{id}",
            "/admin-dashboard",
            "/admin-users",
            "/admin-bookings"
    })
    public String forwardToReact() {
        return "forward:/index.html";
    }
}
