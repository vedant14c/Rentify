package com.officespace.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublicUserView {
    private Integer id;
    private String name;
    private String phone;
}