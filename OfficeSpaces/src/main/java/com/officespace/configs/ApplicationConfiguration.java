package com.officespace.configs;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsPasswordService;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.officespace.security.CustomUserDetailsService;

@Configuration
public class ApplicationConfiguration {

	private final CustomUserDetailsService customUserDetailsService;

	public ApplicationConfiguration(CustomUserDetailsService customUserDetailsService) {

		this.customUserDetailsService = customUserDetailsService;
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public UserDetailsService userDetailsService() {
		return customUserDetailsService;
	}

	@Bean
	public AuthenticationProvider authenticationProvider() {

		DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(passwordEncoder());
		authProvider.setUserDetailsService(customUserDetailsService);
		return authProvider;
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {

		return config.getAuthenticationManager();
	}
}