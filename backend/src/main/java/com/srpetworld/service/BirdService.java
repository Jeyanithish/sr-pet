package com.srpetworld.service;

import com.srpetworld.dto.BirdDtos.BirdDto;
import com.srpetworld.dto.BirdDtos.BirdUpsertRequest;
import com.srpetworld.entity.Bird;
import com.srpetworld.exception.ApiException;
import com.srpetworld.repository.BirdRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class BirdService {

    private final BirdRepository birdRepository;
    private final S3Client s3Client;
    private final String s3Bucket;
    private final String s3Region;
    private final String localUploadDir;

    public BirdService(
            BirdRepository birdRepository,
            @Autowired(required = false) S3Client s3Client,
            @Value("${app.s3.bucket:}") String s3Bucket,
            @Value("${app.s3.region:ap-south-1}") String s3Region,
            @Value("${app.storage.local-upload-dir:uploads}") String localUploadDir
    ) {
        this.birdRepository = birdRepository;
        this.s3Client = s3Client;
        this.s3Bucket = s3Bucket;
        this.s3Region = s3Region;
        this.localUploadDir = localUploadDir;
    }

    public List<BirdDto> listActiveBirds(String category, String search) {
        String cleanCategory = (category == null || category.equalsIgnoreCase("All")) ? null : category.trim();
        String cleanSearch = (search == null) ? null : search.trim();
        return birdRepository.searchActiveBirds(cleanCategory, cleanSearch)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<BirdDto> listAllBirdsAdmin() {
        return birdRepository.findAllByOrderByIdAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public BirdDto createBird(BirdUpsertRequest req) {
        Bird bird = new Bird();
        applyRequest(bird, req);
        return toDto(birdRepository.save(bird));
    }

    @Transactional
    public BirdDto updateBird(Long id, BirdUpsertRequest req) {
        Bird bird = birdRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bird not found"));
        applyRequest(bird, req);
        return toDto(birdRepository.save(bird));
    }

    @Transactional
    public BirdDto uploadImage(Long id, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image file is required");
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image file must be 5 MB or smaller");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unable to read uploaded file");
        }

        String detectedType = detectImageFormat(bytes);
        if (detectedType == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only valid JPEG, PNG, or WebP images are allowed");
        }

        Bird bird = birdRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bird not found"));

        String ext = switch (detectedType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String key = "birds/" + id + "-" + UUID.randomUUID() + ext;

        String imageUrl;
        if (s3Client != null && s3Bucket != null && !s3Bucket.isBlank()) {
            imageUrl = uploadToS3(key, bytes, detectedType);
        } else {
            imageUrl = saveLocally(key, bytes);
        }

        bird.setImageUrl(imageUrl);
        return toDto(birdRepository.save(bird));
    }

    private String detectImageFormat(byte[] bytes) {
        if (bytes.length < 12) return null;
        // JPEG: FF D8 FF
        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47
                && bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A) {
            return "image/png";
        }
        // WebP: RIFF....WEBP
        if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    private String uploadToS3(String key, byte[] bytes, String contentType) {
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(s3Bucket)
                .key(key)
                .contentType(contentType)
                .build();
        s3Client.putObject(putRequest, RequestBody.fromBytes(bytes));
        return "https://" + s3Bucket + ".s3." + s3Region + ".amazonaws.com/" + key;
    }

    private String saveLocally(String key, byte[] bytes) {
        try {
            Path target = Paths.get(localUploadDir).toAbsolutePath().normalize().resolve(key);
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
            return "/uploads/" + key;
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store image locally");
        }
    }

    private void applyRequest(Bird bird, BirdUpsertRequest req) {
        bird.setName(InputSanitizer.sanitizeText(req.name(), 150));
        bird.setCategory(InputSanitizer.sanitizeText(req.category(), 50));
        bird.setAgeTag(InputSanitizer.sanitizeText(req.ageTag(), 100));
        bird.setDescription(InputSanitizer.sanitizeText(req.description(), 2000));
        bird.setPriceInr(req.priceInr());
        bird.setStockQuantity(req.stockQuantity());
        if (req.imageUrl() != null && !req.imageUrl().isBlank()) {
            bird.setImageUrl(InputSanitizer.sanitizeImageUrl(req.imageUrl()));
        }
        if (req.active() != null) {
            bird.setActive(req.active());
        }
    }

    public BirdDto toDto(Bird bird) {
        return new BirdDto(
                bird.getId(),
                bird.getName(),
                bird.getCategory(),
                bird.getAgeTag(),
                bird.getDescription(),
                bird.getPriceInr(),
                bird.getStockQuantity(),
                bird.getUnitsSold(),
                bird.getImageUrl(),
                bird.getActive()
        );
    }
}
