package com.officespace.services;

import java.time.LocalDateTime;

import java.time.LocalDateTime;
import java.util.UUID;


import com.officespace.dtos.ForgotPasswordRequestDTO;
import com.officespace.dtos.ResetPasswordRequestDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.officespace.daos.UserDao;
import com.officespace.dtos.LoginResponseDto;
import com.officespace.entities.User;
import com.officespace.security.JwtService;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class UserServiceImpl {

	@Autowired
	private PasswordEncoder passwordEncoder;
	@Autowired
	private UserDao userDao;
	@Autowired
	private JwtService jwtService;
	@Autowired
	private EmailServiceImpl emailService;

	public String register(User user) {
		if (userDao.findByEmail(user.getEmail()) != null)
			return "User already exists";

		if (user.getRole() == null || user.getRole() == com.officespace.entities.Role.ADMIN) {
			user.setRole(com.officespace.entities.Role.USER);
		}

		user.setPassword(passwordEncoder.encode(user.getPassword()));
		user.setIsActive(true);
		user.setCreatedAt(LocalDateTime.now());
	    user.setUpdatedAt(LocalDateTime.now());
		userDao.save(user);
		return "Registration Successful";
	}

	public LoginResponseDto login(User dto) {
		User user = userDao.findByEmail(dto.getEmail());
		LoginResponseDto response = new LoginResponseDto();

		if (user != null && passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
			if (!Boolean.TRUE.equals(user.getIsActive())) {
				response.setMessage("Account is deactivated");
				return response;
			}
			String token = jwtService.generateToken(user);
			response.setUserId(user.getId());
			response.setName(user.getName());
			response.setEmail(user.getEmail());
			response.setRole(user.getRole().name());
			response.setToken(token);
			response.setMessage("Login Successful");
			return response;
		}

		response.setMessage("Invalid Email or Password");
		return response;
	}
	

	
	public String forgotPassword(ForgotPasswordRequestDTO request) {

	    System.out.println("========== FORGOT PASSWORD ==========");
	    System.out.println("Email Received = " + request.getEmail());

	    User user = userDao.findByEmail(request.getEmail());

	    System.out.println("User Found = " + user);

	    if (user == null) {
	        System.out.println("No user found.");
	        return "If the email exists, a reset link has been sent.";
	    }

	    String token = UUID.randomUUID().toString();

	    System.out.println("Generated Token = " + token);

	    user.setResetToken(token);
	    user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));

	    userDao.save(user);

	    System.out.println("Token saved in database.");

	    String link =
	            "http://localhost:5173/reset-password?token=" + token;

	    System.out.println("Reset Link = " + link);

	    System.out.println("Sending email...");

	    emailService.sendEmail(
	            user.getEmail(),
	            "Password Reset",
	            "Click the link below to reset your password:\n\n" + link
	    );

	    System.out.println("Email sent successfully.");
	    System.out.println("====================================");

	    return "If the email exists, a reset link has been sent.";
	}
	public String resetPassword(ResetPasswordRequestDTO request) {

	    User user = userDao.findByResetToken(request.getToken());

	    if (user == null) {
	        return "Invalid reset token.";
	    }

	    if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
	        return "Reset link has expired.";
	    }

	    user.setPassword(
	            passwordEncoder.encode(request.getNewPassword())
	    );

	    user.setResetToken(null);
	    user.setResetTokenExpiry(null);

	    userDao.save(user);

	    return "Password changed successfully.";
	}
	
	public User activateUser(int id) {

	    User user = userDao.findById(id).orElseThrow();
	    user.setIsActive(true);
	    return userDao.save(user);
	}

	public User deactivateUser(int id) {

	    User user = userDao.findById(id).orElseThrow();
	    user.setIsActive(false);
	    return userDao.save(user);
	}

	public User updateUserRole(int id, com.officespace.entities.Role role) {
	    User user = userDao.findById(id).orElseThrow();
	    user.setRole(role);
	    return userDao.save(user);
	}
	
	public void updateFcmToken(String email, String token) {

	    User user = userDao.findByEmail(email);

	    if (user == null) {
	        throw new RuntimeException("User not found");
	    }

	    user.setFcmToken(token);

	    userDao.save(user);
	}
}