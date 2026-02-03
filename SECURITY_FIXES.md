# Security Fixes - XProManage

## Date: 2026-02-03

### Summary
This document outlines the security vulnerabilities identified by Snyk Code and the fixes implemented to address them.

---

## 🔴 High Severity Issues

### 1. Path Traversal Vulnerability (javascript/PT)
**Location:** `server/controllers/tasks.js:221, 398`  
**Severity:** High (8/10)  
**Issue:** Unsanitized input from HTTP parameters flows into `deleteObject`, where it could be used as a path.

**Description:**
The `attachment.key` parameter was being passed directly to the `deleteFromS3` function without validation. An attacker could potentially manipulate this key to include path traversal sequences (e.g., `../`, `//`) to delete files outside the intended scope or access unauthorized resources.

**Fix Implemented:**
Added comprehensive input validation in `server/config/fileUpload.js`:

```javascript
const deleteFromS3 = async (key) => {
    // Security: Validate the key to prevent path traversal attacks
    if (!key || typeof key !== 'string') {
        throw new Error('Invalid file key');
    }

    // Prevent path traversal attempts
    if (key.includes('..') || key.includes('//') || key.startsWith('/')) {
        throw new Error('Invalid file key: path traversal detected');
    }

    // Ensure the key matches expected pattern (folder/uuid.extension)
    const validKeyPattern = /^[a-zA-Z0-9_-]+\/[a-f0-9-]+\.[a-zA-Z0-9]+$/;
    if (!validKeyPattern.test(key)) {
        throw new Error('Invalid file key format');
    }

    // ... rest of the function
};
```

**Validation Rules:**
- Key must be a non-empty string
- No `..` (parent directory traversal)
- No `//` (double slashes)
- Must not start with `/` (absolute path)
- Must match pattern: `folder/uuid.extension`

---

## 🟡 Medium Severity Issues

### 2. HTTP Instead of HTTPS (javascript/HttpToHttps)
**Location:** `server/server.js:21`  
**Severity:** Medium (4/10)  
**Issue:** `http.createServer` uses HTTP which is an insecure protocol.

**Description:**
The server was using HTTP for all connections, which transmits data in cleartext and is vulnerable to man-in-the-middle attacks.

**Fix Implemented:**
Added HTTPS support for production environments in `server/server.js`:

```javascript
let server;
if (process.env.NODE_ENV === 'production' && process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
    // Production: Use HTTPS if SSL certificates are configured
    const httpsOptions = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH)
    };
    server = https.createServer(httpsOptions, app);
    console.log('Server configured with HTTPS'.green.bold);
} else {
    // Development: Use HTTP (acceptable for local development)
    server = http.createServer(app);
    if (process.env.NODE_ENV === 'production') {
        console.warn('WARNING: Running in production mode without HTTPS.'.yellow.bold);
    }
}
```

**Configuration Required:**
Add to `.env` for production:
```env
NODE_ENV=production
SSL_KEY_PATH=/path/to/private-key.pem
SSL_CERT_PATH=/path/to/certificate.pem
```

---

## 🟢 Low Severity Issues

### 3. Improper Type Validation (javascript/HTTPSourceWithUncheckedType)
**Location:** `server/controllers/tasks.js:157, 277`  
**Severity:** Low (2/10)  
**Issue:** Objects from HTTP body are used without type validation, potentially causing unexpected behavior.

**Description:**
User input from `req.body` was being used directly without verifying the data types, which could lead to:
- Type confusion attacks
- Unexpected behavior when non-string values are passed
- Potential for prototype pollution

**Fixes Implemented:**

#### Fix 1: Task Update Validation (Line 155-158)
```javascript
// Before
if (req.body.status && req.body.status !== previousState.status) 
    changes.status = { from: previousState.status, to: req.body.status };

// After
if (req.body.status && typeof req.body.status === 'string' && req.body.status !== previousState.status) 
    changes.status = { from: previousState.status, to: req.body.status };
```

#### Fix 2: Comment Text Validation (Line 256-278)
```javascript
// Added validation before processing
if (!req.body.text || typeof req.body.text !== 'string') {
    return res.status(400).json({
        success: false,
        message: 'Comment text must be a valid string'
    });
}

// Safe string handling
const commentText = String(req.body.text);
await Activity.logActivity({
    // ...
    changes: { text: commentText.substring(0, 50) + (commentText.length > 50 ? '...' : '') }
});
```

**Validation Added:**
- Type checking for `status`, `priority`, `assignedTo`, `boardColumn`
- Explicit string validation for comment text
- Safe string conversion before substring operations

---

## 📋 Testing Recommendations

### 1. Path Traversal Testing
```bash
# Test with malicious keys
curl -X DELETE http://localhost:5000/api/tasks/{taskId}/attachments/{fileId} \
  -H "Authorization: Bearer {token}" \
  -d '{"key": "../../../etc/passwd"}'

# Should return: "Invalid file key: path traversal detected"
```

### 2. Type Validation Testing
```bash
# Test with non-string comment
curl -X POST http://localhost:5000/api/tasks/{taskId}/comments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"text": {"malicious": "object"}}'

# Should return: "Comment text must be a valid string"
```

### 3. HTTPS Testing
```bash
# In production with SSL configured
curl https://your-domain.com/api/health

# Should return successful response over HTTPS
```

---

## 🔒 Additional Security Recommendations

### Implemented in Previous Audit
✅ Rate limiting on authentication endpoints  
✅ Password strength validation  
✅ JWT token expiration  
✅ Helmet.js security headers  
✅ CORS configuration  
✅ Input sanitization middleware  

### Future Enhancements
- [ ] Implement Content Security Policy (CSP)
- [ ] Add request size limits
- [ ] Implement file upload virus scanning
- [ ] Add audit logging for sensitive operations
- [ ] Implement API versioning
- [ ] Add request signature validation for S3 operations

---

## 📝 Environment Variables

### Required for Production
```env
# Server
NODE_ENV=production
PORT=5000

# SSL/TLS
SSL_KEY_PATH=/path/to/private-key.pem
SSL_CERT_PATH=/path/to/certificate.pem

# Database
MONGODB_URI=mongodb://...

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

---

## 🎯 Compliance Status

| Issue | Severity | Status | Fix Date |
|-------|----------|--------|----------|
| Path Traversal | High | ✅ Fixed | 2026-02-03 |
| HTTP to HTTPS | Medium | ✅ Fixed | 2026-02-03 |
| Type Validation (Line 157) | Low | ✅ Fixed | 2026-02-03 |
| Type Validation (Line 277) | Low | ✅ Fixed | 2026-02-03 |

---

## 📞 Contact

For security concerns or to report vulnerabilities, please contact the security team.

**Last Updated:** 2026-02-03  
**Reviewed By:** Security Audit Team  
**Next Review:** 2026-03-03
