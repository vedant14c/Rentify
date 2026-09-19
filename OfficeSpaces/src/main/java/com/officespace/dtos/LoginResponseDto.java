package com.officespace.dtos;

import lombok.Data;

@Data
public class LoginResponseDto {

    private int userId;
    private String name;
    private String email;
    private String role;
    private String message;
    private String token;
}