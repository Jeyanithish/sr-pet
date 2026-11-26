package com.srpetworld.repository;

import com.srpetworld.entity.Bird;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BirdRepository extends JpaRepository<Bird, Long> {

    List<Bird> findAllByOrderByIdAsc();

    @Query("""
        SELECT b FROM Bird b
        WHERE b.active = true
          AND (:category IS NULL OR :category = '' OR LOWER(b.category) = LOWER(:category))
          AND (:search IS NULL OR :search = '' OR LOWER(b.name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(b.category) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(COALESCE(b.description, '')) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY b.id ASC
        """)
    List<Bird> searchActiveBirds(@Param("category") String category, @Param("search") String search);
}
