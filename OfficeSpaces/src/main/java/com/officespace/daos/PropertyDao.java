package com.officespace.daos;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.officespace.entities.Property;

public interface PropertyDao extends JpaRepository<Property, Integer> {

    List<Property> findByOwnerId(int ownerId);
    long countByApprovalStatus(String approvalStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Property p WHERE p.propertyId = :propertyId")
    Optional<Property> findWithLockByPropertyId(@Param("propertyId") Integer propertyId);
}
