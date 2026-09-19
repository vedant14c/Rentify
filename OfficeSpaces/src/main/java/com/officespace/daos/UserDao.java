package com.officespace.daos;

import org.springframework.data.jpa.repository.JpaRepository;

import com.officespace.entities.Role;
import com.officespace.entities.User;

public interface UserDao extends JpaRepository<User,Integer>{
	User findByEmail(String email);
	 long countByRole(Role role);
	    long countByRoleAndIsActive(Role role, Boolean isActive);
	    
	    User findByResetToken(String resetToken);

}
