package com.srpetworld;

import com.srpetworld.config.JwtService;
import com.srpetworld.dto.AuthDtos.AuthResponse;
import com.srpetworld.dto.AuthDtos.LoginRequest;
import com.srpetworld.dto.AuthDtos.RegisterRequest;
import com.srpetworld.entity.Role;
import com.srpetworld.exception.ApiException;
import com.srpetworld.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class JwtAndAuthTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtService jwtService;

    @Test
    void registerAndLoginCustomerGeneratesValidRoleJwt() {
        AuthResponse registered = authService.register(new RegisterRequest(
                "Ananya Devi",
                "ananya@example.com",
                "9876543210",
                "Secret@123"
        ));

        assertNotNull(registered.token());
        assertEquals(Role.ROLE_USER, registered.user().role());
        assertTrue(jwtService.isTokenValid(registered.token()));
        assertEquals("ananya@example.com", jwtService.extractEmail(registered.token()));
        assertEquals("ROLE_USER", jwtService.extractRole(registered.token()));

        AuthResponse loggedIn = authService.login(new LoginRequest("ananya@example.com", "Secret@123"));
        assertEquals(registered.user().id(), loggedIn.user().id());
    }

    @Test
    void seededAdminAndUserCanLogin() {
        AuthResponse admin = authService.login(new LoginRequest("admin@srpetworld.in", "admin123"));
        assertEquals(Role.ROLE_ADMIN, admin.user().role());
        assertEquals("ROLE_ADMIN", jwtService.extractRole(admin.token()));

        AuthResponse user = authService.login(new LoginRequest("user@srpetworld.in", "user123"));
        assertEquals(Role.ROLE_USER, user.user().role());
        assertEquals("ROLE_USER", jwtService.extractRole(user.token()));
    }

    @Test
    void invalidPasswordThrowsUnauthorized() {
        assertThrows(ApiException.class, () ->
                authService.login(new LoginRequest("admin@srpetworld.in", "wrongpass")));
    }
}
