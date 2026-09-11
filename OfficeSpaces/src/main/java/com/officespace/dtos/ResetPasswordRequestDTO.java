package com.officespace.dtos;

import lombok.Data;

@Data
public class ResetPasswordRequestDTO {

    private String token;

    private String newPassword;

}