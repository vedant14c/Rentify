package com.officespace.entities;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class User implements UserDetails {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "user_id")
	private Integer id;
	@Column(nullable = false)
	private String name;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(name = "password_hash", nullable = false)
	private String password;

	@jakarta.persistence.Convert(converter = com.officespace.converters.RoleConverter.class)
	@Column(nullable = false)
	private Role role;
	private String phone;

	private String profilePic;

	private Boolean isActive;

	private LocalDateTime createdAt;

	private LocalDateTime updatedAt;
	private String preferredCity;

	private String preferredPropertyType;

	private String preferredListingType;

	private Double maxBudget;
	
	@Column(name = "reset_token")
	private String resetToken;

	@Column(name = "reset_token_expiry")
	private LocalDateTime resetTokenExpiry;
	
	@Column(name="fcm_token")
	private String fcmToken;
	
	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority("ROLE_" + role));
	}

	@Override
	public String getUsername() {
		return email;
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return isActive == null || Boolean.TRUE.equals(isActive);
	}

	
}
