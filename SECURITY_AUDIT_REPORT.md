# SR Pet World — Security Audit & Hardening Report

## Executive Summary

An end-to-end security hardening pass and audit was performed across the **SR Pet World** monorepo (`frontend/`, `backend/`, Flyway SQL migrations, Dockerfiles, and AWS deployment configs).

* **Overall Status:** **HARDENED & READY FOR STAGING / PRODUCTION** (pending manual AWS & Razorpay console steps listed below).
* **Critical Findings:** **0 leaked secrets** in code or repository (no `.git` history exists yet; `.gitignore` and `.dockerignore` added before first commit).
* **Automated Verification:** Frontend TypeScript/Vite production build (`npm run build` with `sourcemap: false`) and Backend Spring Boot test suite (`mvn clean test package` including `JwtAndAuthTest`, `OrderAndRazorpayTest`, and `SecurityAuditTest`) verified.

---

## Security Audit Checklist (19 Areas)

| # | Security Area | Status | Findings & Hardening Applied | Key Files | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Secret Hygiene & `VITE_*` Scope** | Pass | Zero hardcoded secrets; frontend only reads `VITE_API_BASE_URL` and `VITE_RAZORPAY_KEY_ID`. | `frontend/src/config/env.ts`, `.env.example` | Static regex scan + TypeScript build |
| 2 | **Startup Env Validation** | Pass | `@ConfigurationProperties` + `@Validated` (`@NotBlank`, `@Size(min=32)`) on JWT & CORS; `env.ts` validates HTTPS API URL in prod. | `AppJwtProperties.java`, `AppCorsProperties.java`, `env.ts` | Spring Boot startup & `SecurityAuditTest` |
| 3 | **`.gitignore` & `.dockerignore`** | Pass | Added `.gitignore` and `.dockerignore` excluding `.env`, `.env.*`, `*.pem`, `*.key`, `application-local.yml`, `target/`, `node_modules/`. | `.gitignore`, `backend/.dockerignore`, `frontend/.dockerignore` | File inspection |
| 4 | **Git History Secret Scan** | Pass | Scanned all tracked/untracked files for `AKIA...`, `rzp_live_`, `rzp_test_`, private keys. No `.git` repo initialized yet; only mock test values in test fixtures. | All repo files | `Select-String` secret scan |
| 5 | **Password Hashing & Policy** | Pass | Upgraded `BCryptPasswordEncoder` to strength **12**; enforced 8+ char mixed-case + number + symbol policy on registration; `passwordHash` never returned in DTOs. | `SecurityConfig.java`, `AuthDtos.java`, `AuthPage.tsx` | `JwtAndAuthTest` + `AuthService` |
| 6 | **JWT & Refresh Token Rotation** | Pass | Minimal JWT claims (`sub`, `role`, `iss`, `iat`, `exp`), 30-min access token, `HttpOnly`/`SameSite=Strict` (`Secure` in prod) `sr_refresh_token` cookie backed by `refresh_tokens` table with rotation & logout revocation. | `JwtService.java`, `AuthController.java`, `V3__security_refresh_tokens.sql` | `JwtAndAuthTest` + `SecurityAuditTest` |
| 7 | **Admin Route Protection** | Pass | `@EnableMethodSecurity` + `@PreAuthorize("hasRole('ADMIN')")` + URL-level `.requestMatchers("/api/admin/**").hasRole("ADMIN")` + deny-by-default `.anyRequest().authenticated()`; frontend `ProtectedRoute` verifies `/api/auth/me`. | `SecurityConfig.java`, `ProtectedRoute.tsx`, `AuthContext.tsx` | `SecurityAuditTest.customerCallingAdminEndpointsReturns403` |
| 8 | **IDOR / BOLA Prevention** | Pass | Customer order endpoints (`GET /api/orders/my`, `GET /api/orders/{orderCode}`) strictly scope queries by authenticated `userId`. | `OrderRepository.java`, `OrderService.java`, `OrderController.java` | `SecurityAuditTest.customerCannotReadAnotherCustomersOrderIdor` |
| 9 | **DTO Isolation & Mass Assignment** | Pass | Zero JPA entities exposed in controllers; `spring.jackson.deserialization.fail-on-unknown-properties=true` rejects unexpected fields (e.g. `role`). | `application.yml`, `GlobalExceptionHandler.java` | `SecurityAuditTest.securityHeadersArePresentAndUnknownJsonPropertiesRejected` |
| 10 | **Server-Side Pricing & Razorpay** | Pass | Totals computed strictly from DB bird prices; HMAC-SHA256 verified with constant-time `MessageDigest.isEqual` on `/verify` and `/webhook` (idempotent). | `OrderService.java`, `RazorpayService.java` | `OrderAndRazorpayTest` + `SecurityAuditTest` |
| 11 | **Safe File Uploads** | Pass | Admin-only, 5 MB limit, magic-byte inspection (JPEG/PNG/WebP only), randomized UUID filenames before S3 or local storage. | `BirdService.java` | Code review & `BirdService` |
| 12 | **Form & Input Sanitization** | Pass | Frontend validators (`validation.ts`) for 10-digit Indian phone, email, strong password, HTML/script rejection; backend `InputSanitizer` strips control chars & blocks HTML/script tags. | `validation.ts`, `InputSanitizer.java`, `OrderDtos.java` | `AuthPage.tsx`, `CartCheckoutPage.tsx` |
| 13 | **XSS & URL Protection** | Pass | Zero `dangerouslySetInnerHTML`, `innerHTML`, `eval()`, or `new Function()`; `sanitizeImageUrl()` enforces `https://` or `/uploads/`. | `BirdCard.tsx`, `AdminInventoryPage.tsx`, `validation.ts` | Static audit across `frontend/src/` |
| 14 | **API Rate Limiting** | Pass | `RateLimitFilter` enforces 10 req/min on `/api/auth/login` & `/register`, 20 req/min on `/checkout` & `/payments/**`, 100 req/min general; returns HTTP `429` + `Retry-After`. | `RateLimitFilter.java` | `SecurityAuditTest.bruteForceLoginTriggers429RateLimit` |
| 15 | **CORS Hardening** | Pass | Explicit `CORS_ALLOWED_ORIGINS` from env, no `*` with `allowCredentials(true)`, restricted methods & headers. | `CorsConfig.java`, `AppCorsProperties.java` | `CorsConfig.java` |
| 16 | **Security Headers** | Pass | `HSTS`, `CSP` (`object-src 'none'`, `frame-ancestors 'none'`, Razorpay & S3 allowlisted), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` in Spring & Amplify `customHttp.yml`. | `SecurityConfig.java`, `frontend/customHttp.yml` | `SecurityAuditTest` |
| 17 | **Production Debug Hardening** | Pass | `server.error.include-stacktrace/message/binding-errors: never`, `show-sql: false`, `open-in-view: false`, Actuator `health` only (`show-details: never`), `springdoc` disabled, Vite `sourcemap: false`. | `application-prod.yml`, `vite.config.ts` | Config inspection + `npm run build` |
| 18 | **Database & Container Hygiene** | Pass | 100% parameterized JPA/JPQL queries, `ddl-auto: validate`, non-root `USER appuser` in `backend/Dockerfile`. | `BirdRepository.java`, `OrderRepository.java`, `Dockerfile` | Code & Dockerfile inspection |
| 19 | **Dependency & CVE Audit** | Partial | Unused/mock gaps checked; `npm audit` and `mvn dependency:analyze` were blocked from external registry by local TLS proxy (`UNABLE_TO_VERIFY_LEAF_SIGNATURE` / `PKIX path building failed`). | `package.json`, `pom.xml` | Run `npm audit` on a non-proxied network before release |

---

## Remaining Manual AWS & Razorpay Console Actions

1. **AWS Secrets Manager / App Runner Env Vars:** Generate a fresh 64-char random `JWT_SECRET` and set `DB_URL` (with `?sslmode=require`), `DB_USERNAME` (least-privilege app user, not RDS master), `DB_PASSWORD`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `CORS_ALLOWED_ORIGINS=https://<your-domain>.amplifyapp.com`.
2. **Amazon RDS:** Place RDS in a private subnet, enable storage encryption at rest, and restrict port `5432` Security Group ingress strictly to your App Runner VPC connector.
3. **Amazon S3 & CloudFront:** Enable **Block Public Access** on the S3 bird-images bucket and serve images via CloudFront OAC (or presigned URLs), granting App Runner IAM role only `s3:PutObject` on `birds/*`.
4. **AWS WAF:** Attach an AWS WAF web ACL in front of CloudFront / App Runner for DDoS and OWASP Core Rule Set protection.
5. **Razorpay Live Mode:** Register your live Amplify HTTPS domain in Razorpay Dashboard, configure the webhook URL `https://<backend-domain>/api/payments/webhook` for `payment.captured` and `payment.failed`, and switch to `rzp_live_*` keys.
6. **Dependency Scan:** Run `npm audit --audit-level=moderate` and OWASP Dependency-Check in CI/CD (GitHub Actions) where direct internet TLS access to npm/Maven Central is available.
