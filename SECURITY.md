# Security Policy

The Tarumanagara English Club (TEC) Online Voting System is designed with multiple layers of security to ensure election integrity, prevent tampering, and protect user data. 

This document outlines the core security implementations within the architecture of the platform.

## 🛡️ Core Security Features

### 1. Database Security & SQL Injection Prevention
- **Parameterized Queries**: All database queries executed through the backend use strict parameterized queries (prepared statements) via the native `mariadb` driver. 
- **Type Casting**: User inputs are heavily validated and explicitly cast (e.g., `Number(id)`) before touching database execution.
- **Atomic Transactions**: All voting operations (e.g., casting a vote) are wrapped in atomic SQL transactions (`BEGIN; COMMIT; ROLLBACK;`) to prevent race conditions or double-voting under heavy network load.

### 2. Double-Vote Prevention & Device Fingerprinting
- **Primary Guard**: The primary defense against multiple voting is the database constraint. A voter's `vote` column flips from `0` to `1` transactionally.
- **Device Fingerprinting (Anti-Cheating)**: The frontend utilizes `@fingerprintjs/fingerprintjs` alongside a custom canvas/audio hashing algorithm to generate a unique device hash.
- **Device Restrictions**: When a vote is cast, the backend logs the `device_fingerprint` in the `device_votes` table. If a user attempts to vote using a different student ID on the exact same device, the backend immediately blocks the request. This preserves anonymity while actively preventing a single student from voting on behalf of multiple people on the same laptop.

### 3. Authentication & Authorization (JWT)
- **Segregated Access**: The API utilizes robust JSON Web Tokens (JWT) through `@elysiajs/jwt`. Tokens are uniquely typed (`"type": "admin"` or `"type": "voter"`) preventing vertical privilege escalation.
- **Stateless Expiration**: Tokens expire automatically after 24 hours.
- **Admin Verification**: The backend dynamically enforces admin privileges. Any attempt by a voter to hit a protected `/api/admin/*` endpoint returns a hard 401 Unauthorized.

### 4. Password Security
- **Bcrypt Hashing**: All administrative passwords are encrypted using Bcrypt (Cost Factor: 10). Passwords are never stored or transmitted in plain text.
- **Auto-Migration Pipeline**: The system includes a legacy password migration pipeline. If an old admin logs in using a legacy plaintext password, the system intercepts the login, automatically hashes the password using Bcrypt, updates the database, and issues the token.

### 5. Network & API Protection
- **Progressive Captcha Verification**: The system employs a dynamic, multi-tiered security perimeter for login attempts:
  - Initial attempts are frictionless to preserve UX.
  - After a low threshold of failed attempts (e.g., 3 for admins, 5 for voters), the system enforces Captcha verification.
  - The frontend utilizes a dual-provider fallback architecture, primarily requesting Google reCAPTCHA v2, and seamlessly failing over to hCaptcha if Google services are unavailable or quota is exceeded.
- **Strict Rate Limiting**: If an attacker bypasses or completes the Captcha but continues to fail authentication (e.g., 5 total failures for admins, 10 for voters), the system implements rigorous IP-based rate limiting via `elysia-rate-limit`, completely locking out the IP address to neutralize brute-force and dictionary attacks.
- **Strict CORS**: Cross-Origin Resource Sharing (CORS) is explicitly restricted to designated origins configured in the `.env` (e.g., `CORS_ORIGIN=http://localhost:4200`). This mitigates CSRF attacks.

### 6. Vulnerability & Error Handling
- **Path Traversal Protection**: The static file upload server explicitly sanitizes filenames to prevent Directory Traversal attacks. Files are strictly confined to the `/uploads/` directory.
- **Validation Schemas**: Every API endpoint uses strict Elysia/TypeBox validation. Any request missing required fields, containing extra invalid payloads, or matching the wrong type (e.g., sending a string instead of a number) is rejected at the middleware level before reaching business logic.
- **Silent Failures**: In production environments (`NODE_ENV=production`), the server strips verbose error messages and stack traces to prevent information leakage.

## 🐛 Reporting a Vulnerability

If you discover a security vulnerability within the system, please do not disclose it publicly. 
Instead, please contact the repository administrators directly.

Please include:
- A detailed description of the vulnerability.
- Steps to reproduce the issue.
- Potential impact and, if possible, a suggested mitigation.
