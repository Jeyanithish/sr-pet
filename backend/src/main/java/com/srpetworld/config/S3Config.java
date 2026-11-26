package com.srpetworld.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class S3Config implements WebMvcConfigurer {

    @Value("${app.s3.bucket:}")
    private String bucket;

    @Value("${app.s3.region:ap-south-1}")
    private String region;

    @Value("${app.storage.local-upload-dir:uploads}")
    private String localUploadDir;

    @Bean
    public S3Client s3Client() {
        if (bucket == null || bucket.isBlank()) {
            return null;
        }
        return S3Client.builder()
                .region(Region.of(region))
                .build();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(localUploadDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }
}
