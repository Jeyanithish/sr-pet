package com.srpetworld.controller;

import com.srpetworld.dto.BirdDtos.BirdDto;
import com.srpetworld.dto.BirdDtos.BirdUpsertRequest;
import com.srpetworld.service.BirdService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
public class BirdController {

    private final BirdService birdService;

    public BirdController(BirdService birdService) {
        this.birdService = birdService;
    }

    @GetMapping("/api/birds")
    public ResponseEntity<List<BirdDto>> listActiveBirds(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(birdService.listActiveBirds(category, search));
    }

    @GetMapping("/api/admin/birds")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BirdDto>> listAllBirdsAdmin() {
        return ResponseEntity.ok(birdService.listAllBirdsAdmin());
    }

    @PostMapping("/api/admin/birds")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BirdDto> createBird(@Valid @RequestBody BirdUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(birdService.createBird(request));
    }

    @PutMapping("/api/admin/birds/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BirdDto> updateBird(@PathVariable Long id,
                                              @Valid @RequestBody BirdUpsertRequest request) {
        return ResponseEntity.ok(birdService.updateBird(id, request));
    }

    @PostMapping("/api/admin/birds/{id}/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BirdDto> uploadBirdImage(@PathVariable Long id,
                                                   @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(birdService.uploadImage(id, file));
    }
}
