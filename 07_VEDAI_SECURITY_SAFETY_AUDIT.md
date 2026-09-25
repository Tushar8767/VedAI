# 07_VEDAI_SECURITY_SAFETY_AUDIT: Security, Safety & Cryptographic Audit

**Auditor**: External Technical Invigilator  
**Audit Standard**: OWASP Web Security Standards + IEEE Clinical AI Safety Principles  
**Verdict**: **ENTERPRISE-GRADE HARDENING & EXCEPTIONAL SAFETY DESIGN**  

---

## 1. Safety Subsystem Audit (5-Layer Crisis Interception)

### Crisis Interception Mechanics
VedAI does not use a single naive keyword list. In `backend/services/safetyService.js`, it implements an ordered 5-layer scanning hierarchy:
1. **Layer 1 (Explicit English)**: Scans for direct suicidal ideation (*"kill myself"*, *"end my life"*, *"want to die"*, *"no reason to live"*).
2. **Layer 2 (Phonetic Misspellings & Leetspeak)**: Intercepts obfuscated crisis phrases (*"suecide"*, *"kll myslf"*, *"kms"*, *"unalive myself"*).
3. **Layer 3 (Hinglish Expressions)**: Captures colloquial Hindi-English distress (*"mujhe ab jeena nahi hai"*, *"jaan de dunga"*, *"marne ka mann hai"*).
4. **Layer 4 (Marathi Expressions)**: Captures regional Marathi distress (*"mala jagaycha nahiye"*, *"marun jaavas vatta"*, *"aayushya sampvun takaycha"*).
5. **Layer 5 (Indirect Burdensomeness & Despair)**: Identifies perceived burdensomeness (*"everyone would be happier without me"*, *"nobody cares if I live or die"*).

### False-Positive Filtering (Benign Idiom Whitelist)
To prevent embarrassing false alarms on common figurative idioms, `safetyService.js:14-19` applies a benign filter:
- *"killing it at work"* -> **PASS (Not High Risk)**
- *"dead tired after gym"* -> **PASS (Not High Risk)**
- *"dying of laughter"* -> **PASS (Not High Risk)**
- *"end this project"* -> **PASS (Not High Risk)**

### Contradictory Input Safety Priority
When a user submits: *"I'm killing it at work but I want to die"*, the safety priority logic overrides the benign filter and immediately flags `isHighRisk: true`.

### Safety Recall & Precision Metrics (Tested via `layered-safety.test.js`):
- **True Positives**: 7 / 7 (100.0%)
- **False Negatives**: 0 / 7 (0.0%)
- **False Positives**: 0 / 4 on benign controls
- **Emergency Resources Delivered**: Tele-MANAS (14416), National Emergency (112), Suicide & Crisis Lifeline (988), Vandrevala Foundation (9999 666 555).

---

## 2. Clinical Boundary Enforcement

In `backend/services/intentRouter.js:27`, the system inspects incoming reflections and chat queries for diagnostic and pharmaceutical requests:
- *"Do I have depression?"* -> Refuses diagnosis; states VedAI is a non-clinical reflection companion.
- *"What medication should I take?"* -> Refuses prescription; directs user to a licensed medical doctor.
- *"Am I bipolar?"* -> Refuses psychiatric labeling.

---

## 3. Cryptographic Storage Audit (AES-256-GCM)

### Code Inspection (`backend/utils/encryption.js`):
- **Cipher**: Authenticated Galois/Counter Mode (`aes-256-gcm`).
- **Key Derivation**: 256-bit SHA-256 digest of master secret.
- **Initialization Vector**: Cryptographically secure 12-byte (96-bit) random IV per entry (`crypto.randomBytes(12)`).
- **Authentication Tag**: 16-byte GCM authentication tag verifying ciphertext authenticity.
- **Ciphertext Format**: `enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>`.
- **Tampering Resistance**: Tampering with a single bit in the ciphertext or tag throws an authentication error in `crypto.createDecipheriv()`, preventing corrupted plaintext leakage.
- **Legacy Compatibility**: Transparently supports unencrypted legacy records via prefix detection (`enc:v1:`).

---

## 4. Web Application Security Hardening

| Security Category | Implementation Detail | Empirical Evidence | Status |
| :--- | :--- | :--- | :---: |
| **SQL Injection (SQLi)** | Parameterized queries (`$1, $2, ...`) across all PostgreSQL repository files. Zero string concatenation. | Subtest `SEC-001` with `' OR '1'='1' --` passed safely. | **PASS** |
| **Cross-Site Scripting (XSS)** | HTML entity escaping (`escapeHtml()`) applied to titles and contents before database insertion. | Subtest `SEC-002` with `<script>alert(1)</script>` passed safely. | **PASS** |
| **Password Security** | Salted PBKDF2 with 120,000 iterations of SHA-512 and unique 16-byte salts. Verification uses `crypto.timingSafeEqual()`. | Subtests `AUTH-018` through `AUTH-020` pass. Hashes stripped from responses. | **PASS** |
| **JWT Tampering** | HS256 JWT tokens verified with constant-time buffer comparison. Expired and tampered tokens rejected. | Subtests `AUTH-012` and `AUTH-013` pass without RangeError crashes. | **PASS** |
| **Broken Access Control (IDOR)** | Strict multi-tenant isolation via `WHERE id = $1 AND user_id = $2`. | Subtest `AUTHZ-001` (User B modifying User A journal) rejected with 404. | **PASS** |
| **Rate Limiting / DoS** | `express-rate-limit` configured: 500 req/15m on auth, 2000 req/1m on API routes. | Gateway returns 429 when thresholds exceeded. | **PASS** |
| **Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, HSTS. | Hardened middleware in `backend/server.js:20-31`. | **PASS** |

---

## 5. Camera & Data Privacy Audit

- **Frame Ephemerality**: Inspection of `app.js`, `server.js`, and `app.py` confirms that camera frames captured as base64 strings reside purely in volatile RAM during inference.
- **Disk Persistence**: **Zero bytes of video or image files are written to disk or the filesystem.**
- **Database Persistence**: The PostgreSQL schema (`schema.sql`) contains no BLOB or bytea columns for images. Only the final numerical probabilities and modality string (`'multimodal'`) are saved.
- **Data Sovereignty**: The Settings drawer provides 1-click **Data Export** and **Cascading Account Purge** (`DELETE /api/v1/auth/account`), removing user rows and cascading to all associated history and journals.
