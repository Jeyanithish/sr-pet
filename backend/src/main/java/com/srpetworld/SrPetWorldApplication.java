package com.srpetworld;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SrPetWorldApplication {

    public static void main(String[] args) {
        SpringApplication.run(SrPetWorldApplication.class, args);
    }
}
