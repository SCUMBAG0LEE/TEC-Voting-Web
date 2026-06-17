# Security Policy

The Tarumanagara English Club (TEC) Online Voting System is built on a highly secure, edge-native architecture designed to guarantee election integrity, prevent tampering, and protect user data at massive scale.

This document outlines the core security implementations within the Cloudflare serverless platform.

## 🛡️ Core Security Features

### 1. Database Security & Edge Architecture
- **Drizzle ORM**: All database interactions are strictly type-safe and parameterized via Drizzle ORM, completely neutralizing SQL injection vulnerabilities.
- **Neon Serverless Postgres**: The database utilizes Neon's secure, isolated compute endpoints.
- **Atomic Transactions**: Critical operations like casting a vote are wrapped in atomic SQL transactions to prevent race conditions or double-voting under heavy network load.

### 2. Edge-Native Anti-Cheating & Fingerprinting
- **Cloudflare request.cf Validation**: We leverage Cloudflare's native edge request properties (`cf-connecting-ip`, ASN, TLS cipher versions) to uniquely identify and trace requests at the edge.
- **Extreme Forensic Telemetry ("Smart Logger")**: The frontend passively collects highly advanced hardware signatures without requiring user permissions. This includes: WebGL/GPU rendering hashes, Canvas image data, CPU Math floating-point discrepancies, AudioContext wave processing hashes, 50+ installed Font detection arrays, WebRTC Local IP extraction, and Incognito/Private Browsing storage heuristics.
- **VPN & Proxy Trap**: The system rapidly cycles through 9 different IP-checking APIs to bypass strict adblockers. It then compares the browser's perceived Public IP against Cloudflare's spoof-proof `cf-connecting-ip` to instantly flag if a voter is routing their traffic through a proxy or split-tunnel VPN.
- **Multi-Voting Prevention**: If a user attempts to vote using multiple student IDs from the exact same physical device/browser signature, the backend immediately blocks the request. This preserves anonymity while actively preventing a single student from hijacking the election.

### 3. Authentication & Authorization (JWT)
- **Segregated Access**: The API utilizes robust JSON Web Tokens (JWT) signed at the edge. Tokens are uniquely typed (`"type": "admin"` or `"type": "voter"`) preventing vertical privilege escalation.
- **Stateless Verification**: Tokens expire automatically after 24 hours.
- **Admin Enforcement**: The backend dynamically enforces admin privileges. Any attempt by a voter to hit a protected `/api/admin/*` endpoint returns a hard 401 Unauthorized.

### 4. Zero-Dependency Password Security
- **Native Web Crypto API**: Administrative passwords are encrypted using the native V8 Web Crypto API (`crypto.subtle`). 
- **PBKDF2 Hashing**: We utilize PBKDF2 with SHA-256 (100,000 iterations) and 16-byte random salts.
- **No Third-Party Crypto**: By relying exclusively on built-in Web APIs, we eliminate supply chain attacks related to third-party cryptography packages.

### 5. Network Protection & Cloudflare WAF
- **Cloudflare Rate Limiting & Upstash Redis**: The system utilizes Cloudflare's Edge WAF for Layer 7 DDoS mitigation. For application-level brute-force protection (e.g., login spam), it uses Upstash Redis HTTP Pipelining to track and block malicious IPs in 0ms globally without draining compute resources.
- **Strict CORS**: Cross-Origin Resource Sharing (CORS) is explicitly restricted to designated origins configured in the environment variables (e.g., `CORS_ORIGIN`). This mitigates CSRF attacks.
- **DDoS Mitigation**: By deploying the React frontend on Cloudflare Pages and the API on Cloudflare Workers, the entire infrastructure sits behind Cloudflare's enterprise-grade DDoS protection.

### 6. Vulnerability & Error Handling
- **Valibot Schemas**: Every API endpoint uses `valibot` for extreme, tree-shakable validation. Any request missing required fields, containing extra invalid payloads, or matching the wrong type is rejected at the edge before reaching business logic.
- **Silent Failures**: In production environments (`NODE_ENV=production`), the server strips verbose error messages and stack traces to prevent information leakage.

## 🐛 Reporting a Vulnerability

If you discover a security vulnerability within the system, please do not disclose it publicly. 
Instead, please contact the repository administrators directly.

Please include:
- A detailed description of the vulnerability.
- Steps to reproduce the issue.
- Potential impact and, if possible, a suggested mitigation.
