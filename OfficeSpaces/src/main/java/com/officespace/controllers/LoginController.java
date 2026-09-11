package com.officespace.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.officespace.dtos.LoginResponseDto;
import com.officespace.entities.User;
import com.officespace.services.EmailServiceImpl;
import com.officespace.services.UserServiceImpl;
import org.springframework.web.bind.annotation.GetMapping;
import com.officespace.dtos.ForgotPasswordRequestDTO;
import com.officespace.dtos.ResetPasswordRequestDTO;

@RestController
public class LoginController {
	@Autowired
	private UserServiceImpl userService;
	
	@Autowired
	private EmailServiceImpl emailService;

	@PostMapping("/register")
	public String register(@RequestBody User user) {
		return userService.register(user);
	}

	@PostMapping("/login")
	public LoginResponseDto login(@RequestBody User user) {
		return userService.login(user);
	}
	
	@GetMapping("/test-email")
	public String testEmail() {

	    emailService.sendEmail(
	            "2k18vedant@gmail.com",
	            "SpaceHub Email Test",
	            "Congratulations! Spring Boot Email is working."
	    );

	    return "Email Sent Successfully";
	}
	@PostMapping("/forgot-password")
	public String forgotPassword(
	        @RequestBody ForgotPasswordRequestDTO request) {

	    return userService.forgotPassword(request);
	}
	
	@PostMapping("/reset-password")
	public String resetPassword(
	        @RequestBody ResetPasswordRequestDTO request) {

	    return userService.resetPassword(request);
	}
}
