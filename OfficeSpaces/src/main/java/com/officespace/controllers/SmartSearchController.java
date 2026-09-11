package com.officespace.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.officespace.dtos.SmartSearchRequest;
import com.officespace.entities.Property;
import com.officespace.services.SmartSearchServiceImpl;

@RestController
@RequestMapping("/search")
public class SmartSearchController {

    private final SmartSearchServiceImpl smartSearchService;

    public SmartSearchController(SmartSearchServiceImpl smartSearchService) {
        this.smartSearchService = smartSearchService;
    }

    @PostMapping("/smart")
    public List<Property> smartSearch(@RequestBody SmartSearchRequest request) {
        return smartSearchService.search(request.getQuery());
    }
}