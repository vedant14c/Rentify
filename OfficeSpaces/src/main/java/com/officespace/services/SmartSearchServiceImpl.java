package com.officespace.services;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.officespace.daos.PropertyDao;
import com.officespace.dtos.SmartSearchRequest;
import com.officespace.entities.Property;

@Service
public class SmartSearchServiceImpl {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final PropertyDao propertyDao;

    public SmartSearchServiceImpl(PropertyDao propertyDao) {
        this.propertyDao = propertyDao;
    }

    public List<Property> search(String query) {
        SmartSearchRequest filters = extractFilters(query);
        return applyFilters(filters);
    }

    private SmartSearchRequest extractFilters(String query) {
        String prompt =
            "Extract search filters from this property search query as JSON only, " +
            "no explanation, no markdown. Fields: city (string or null), " +
            "propertyType (one of: office, house, apartment, villa or null), " +
            "listingType (rent or null), maxPrice (number or null, monthly price in INR), " +
            "minArea (number or null, in sqft). " +
            "If the query mentions \"cheap\" or \"affordable\", set a reasonable maxPrice. " +
            "Query: \"" + query + "\"";

        try {
            JSONObject requestBody = new JSONObject();
            JSONArray contents = new JSONArray();
            JSONObject content = new JSONObject();
            JSONArray parts = new JSONArray();
            JSONObject part = new JSONObject();
            part.put("text", prompt);
            parts.put(part);
            content.put("parts", parts);
            contents.put(content);
            requestBody.put("contents", contents);

            JSONObject generationConfig = new JSONObject();
            generationConfig.put("responseMimeType", "application/json");        
            requestBody.put("generationConfig", generationConfig);

            System.out.println("========== REQUEST JSON ==========");
            System.out.println(requestBody.toString(2));
            System.out.println("==================================");
            
            
            HttpClient client = HttpClient.newHttpClient();
            
            System.out.println("================================");
            System.out.println("API URL : " + apiUrl);
            System.out.println("API KEY : " + apiKey);
            System.out.println("================================");
            
            
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "?key=" + apiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                    requestBody.toString(), StandardCharsets.UTF_8))
                .build();

        
            HttpResponse<String> response =
                    client.send(request, HttpResponse.BodyHandlers.ofString());

            System.out.println("Status : " + response.statusCode());
            System.out.println(response.body());

            if (response.statusCode() != 200) {
                throw new RuntimeException(
                    "Gemini Error " + response.statusCode() + "\n" + response.body());
            }
            
            System.out.println("Status Code : " + response.statusCode());
            System.out.println("Response Body:");
            System.out.println(response.body());

            JSONObject responseJson = new JSONObject(response.body());
            String text = responseJson
                .getJSONArray("candidates")
                .getJSONObject(0)
                .getJSONObject("content")
                .getJSONArray("parts")
                .getJSONObject(0)
                .getString("text");

            JSONObject filtersJson = new JSONObject(text);

            SmartSearchRequest filters = new SmartSearchRequest();
            filters.setCity(filtersJson.optString("city", null));
            filters.setPropertyType(filtersJson.optString("propertyType", null));
            
            if (filters.getPropertyType() != null) {
                switch (filters.getPropertyType().toLowerCase()) {
                    case "office":
                    case "private office":
                        filters.setPropertyType("Office");
                        break;
                    case "house":
                    case "independent house":
                    case "home":
                        filters.setPropertyType("House");
                        break;
                    case "apartment":
                    case "flat":
                    case "residency":
                        filters.setPropertyType("Apartment");
                        break;
                    case "villa":
                    case "bungalow":
                        filters.setPropertyType("Villa");
                        break;
                }
            }
            
            filters.setListingType(filtersJson.optString("listingType", null));

            if (!filtersJson.isNull("maxPrice")) {
                filters.setMaxPrice(filtersJson.optDouble("maxPrice"));
            }
            if (!filtersJson.isNull("minArea")) {
                filters.setMinArea(filtersJson.optDouble("minArea"));
            }

            if (filters.getListingType() != null) {
                filters.setListingType(filters.getListingType().toLowerCase());
            }
            
            System.out.println("========== AI FILTERS ==========");
            System.out.println("City         : " + filters.getCity());
            System.out.println("PropertyType : " + filters.getPropertyType());
            System.out.println("ListingType  : " + filters.getListingType());
            System.out.println("MaxPrice     : " + filters.getMaxPrice());
            System.out.println("MinArea      : " + filters.getMinArea());
            System.out.println("================================");
            return filters;
            
        } catch (Exception e) {
            return new SmartSearchRequest();
        }
    }

    private List<Property> applyFilters(SmartSearchRequest filters) {
        List<Property> approvedProperties = propertyDao.findAll().stream()
            .filter(p -> Boolean.TRUE.equals(p.getIsApproved()))
            .collect(Collectors.toList());

        return approvedProperties.stream()

        	    .peek(p -> System.out.println("Checking : " +
        	            p.getCity() + " | " +
        	            p.getPropertyType() + " | " +
        	            p.getListingType() + " | " +
        	            p.getPrice()))

        	    .filter(p -> {
        	        boolean match =
        	                (filters.getCity() == null ||
        	                        p.getCity().equalsIgnoreCase(filters.getCity()))
        	                &&
        	                (filters.getPropertyType() == null ||
        	                        p.getPropertyType().equalsIgnoreCase(filters.getPropertyType()))
        	                &&
        	                (filters.getListingType() == null ||
        	                        p.getListingType().equalsIgnoreCase(filters.getListingType()))
        	                &&
        	                (filters.getMaxPrice() == null ||
        	                        p.getPrice() <= filters.getMaxPrice());

        	        System.out.println("MATCH = " + match);

        	        return match;
        	    })

        	    .collect(Collectors.toList());
//        return approvedProperties.stream()
//
//        	    .peek(p -> System.out.println(
//        	        p.getCity() + " | " +
//        	        p.getPropertyType() + " | " +
//        	        p.getListingType() + " | " +
//        	        p.getPrice()))
//
//        	    .filter(p -> filters.getCity() == null ||
//        	        (p.getCity() != null &&
//        	            p.getCity().toLowerCase().contains(filters.getCity().toLowerCase())))
//
//        	    .filter(p -> filters.getPropertyType() == null ||
//        	        (p.getPropertyType() != null &&
//        	            p.getPropertyType().equalsIgnoreCase(filters.getPropertyType())))
//
//        	    .filter(p -> filters.getListingType() == null ||
//        	        (p.getListingType() != null &&
//        	            p.getListingType().equalsIgnoreCase(filters.getListingType())))
//
//        	    .filter(p -> filters.getMaxPrice() == null ||
//        	        (p.getPrice() != null &&
//        	            p.getPrice() <= filters.getMaxPrice()))
//
//        	    .filter(p -> filters.getMinArea() == null ||
//        	        (p.getAreaSqft() != null &&
//        	            p.getAreaSqft() >= filters.getMinArea()))
//
//        	    .collect(Collectors.toList());
    }
}