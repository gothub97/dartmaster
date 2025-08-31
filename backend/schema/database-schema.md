# Dartmaster Database Schema Design

## Overview
This document defines the complete database schema for the Dartmaster application using Appwrite as the backend service. The schema is designed for scalability (1000+ concurrent users) and real-time performance (<500ms updates).

## Collections Overview

### 1. Users Collection (`users`)
**Collection ID:** `users`  
**Purpose:** Core user account information managed by Appwrite Auth  
**Permissions:** Read/Write by authenticated users (own documents only)

```json
{
  "$id": "string (Appwrite User ID)",
  "name": "string (required, max 128 chars)",
  "email": "string (required, unique, validated)",
  "phone": "string (optional, E.164 format)",
  "emailVerification": "boolean (default: false)",
  "phoneVerification": "boolean (default: false)",
  "status": "boolean (default: true)",
  "labels": "array<string> (roles, permissions)",
  "passwordUpdate": "datetime (auto-managed)",
  "registration": "datetime (auto-managed)",
  "$createdAt": "datetime (auto-managed)",
  "$updatedAt": "datetime (auto-managed)"
}
```

### 2. Profiles Collection (`profiles`)
**Collection ID:** `profiles`  
**Purpose:** Extended user profile information  
**Permissions:** Read by all authenticated users, Write by owner only

```json
{
  "$id": "string (auto-generated)",
  "userId": "string (required, foreign key to users.$id)",
  "displayName": "string (required, max 128 chars)",
  "bio": "string (optional, max 500 chars)",
  "avatar": "string (optional, file ID from avatars bucket)",
  "country": "string (required, ISO 3166-1 alpha-2)",
  "timezone": "string (optional, IANA timezone)",
  "clubId": "string (optional, foreign key to clubs.$id)",
  "clubName": "string (optional, denormalized for performance)",
  "preferences": {
    "theme": "string (light|dark, default: light)",
    "notifications": {
      "email": "boolean (default: true)",
      "push": "boolean (default: true)",
      "social": "boolean (default: true)"
    },
    "privacy": {
      "profileVisibility": "string (public|friends|private, default: public)",
      "showStats": "boolean (default: true)",
      "showActivity": "boolean (default: true)"
    }
  },
  "stats": {
    "totalMatches": "integer (default: 0)",
    "totalPractice": "integer (default: 0)",
    "averageScore": "float (default: 0.0)",
    "checkoutPercentage": "float (default: 0.0)",
    "doublesPercentage": "float (default: 0.0)",
    "total180s": "integer (default: 0)",
    "highestCheckout": "integer (default: 0)",
    "bestAverage": "float (default: 0.0)",
    "lastCalculated": "datetime"
  },
  "isActive": "boolean (default: true)",
  "$createdAt": "datetime (auto-managed)",
  "$updatedAt": "datetime (auto-managed)"
}
```

### 3. Sessions Collection (`sessions`)
**Collection ID:** `sessions`  
**Purpose:** Enhanced session management with remember me functionality  
**Permissions:** Read/Write by session owner only

```json
{
  "$id": "string (auto-generated)",
  "userId": "string (required, foreign key to users.$id)",
  "sessionId": "string (required, Appwrite session ID)",
  "deviceInfo": {
    "userAgent": "string (required)",
    "platform": "string (web|mobile|desktop)",
    "browser": "string (optional)",
    "os": "string (optional)",
    "deviceId": "string (generated fingerprint)"
  },
  "location": {
    "ip": "string (hashed for privacy)",
    "country": "string (optional)",
    "city": "string (optional)"
  },
  "rememberMe": "boolean (default: false)",
  "isActive": "boolean (default: true)",
  "lastActivity": "datetime (updated on each request)",
  "expiresAt": "datetime (required)",
  "$createdAt": "datetime (auto-managed)",
  "$updatedAt": "datetime (auto-managed)"
}
```

### 4. Clubs Collection (`clubs`)
**Collection ID:** `clubs`  
**Purpose:** Club/league management for organized play  
**Permissions:** Read by all users, Write by club admins

```json
{
  "$id": "string (auto-generated)",
  "name": "string (required, max 128 chars)",
  "description": "string (optional, max 1000 chars)",
  "logo": "string (optional, file ID from logos bucket)",
  "country": "string (required, ISO 3166-1 alpha-2)",
  "address": {
    "street": "string (optional)",
    "city": "string (required)",
    "state": "string (optional)",
    "postalCode": "string (optional)",
    "coordinates": {
      "latitude": "float (optional)",
      "longitude": "float (optional)"
    }
  },
  "contact": {
    "email": "string (optional)",
    "phone": "string (optional)",
    "website": "string (optional)"
  },
  "adminIds": "array<string> (user IDs with admin permissions)",
  "memberCount": "integer (default: 0, denormalized)",
  "settings": {
    "isPublic": "boolean (default: true)",
    "requireApproval": "boolean (default: false)",
    "allowGuests": "boolean (default: true)"
  },
  "isActive": "boolean (default: true)",
  "$createdAt": "datetime (auto-managed)",
  "$updatedAt": "datetime (auto-managed)"
}
```

### 5. Recovery Tokens Collection (`recovery_tokens`)
**Collection ID:** `recovery_tokens`  
**Purpose:** Secure password recovery token management  
**Permissions:** System only (no user access)

```json
{
  "$id": "string (auto-generated)",
  "userId": "string (required, foreign key to users.$id)",
  "token": "string (required, hashed, unique)",
  "email": "string (required, for verification)",
  "isUsed": "boolean (default: false)",
  "expiresAt": "datetime (required, 1 hour from creation)",
  "usedAt": "datetime (optional)",
  "$createdAt": "datetime (auto-managed)",
  "$updatedAt": "datetime (auto-managed)"
}
```

### 6. Audit Logs Collection (`audit_logs`)
**Collection ID:** `audit_logs`  
**Purpose:** Security and compliance audit trail  
**Permissions:** System only

```json
{
  "$id": "string (auto-generated)",
  "userId": "string (optional, foreign key to users.$id)",
  "action": "string (required, e.g., 'user.login', 'user.register')",
  "resource": "string (optional, affected resource)",
  "details": {
    "ip": "string (hashed)",
    "userAgent": "string",
    "success": "boolean",
    "errorCode": "string (optional)",
    "metadata": "object (additional context)"
  },
  "timestamp": "datetime (required)",
  "$createdAt": "datetime (auto-managed)"
}
```

## Indexes for Performance

### Profiles Collection Indexes
```javascript
// Primary queries
db.profiles.createIndex({ userId: 1 }, { unique: true })
db.profiles.createIndex({ clubId: 1 })
db.profiles.createIndex({ country: 1 })
db.profiles.createIndex({ "stats.averageScore": -1 })
db.profiles.createIndex({ isActive: 1, "$updatedAt": -1 })

// Compound indexes for leaderboards
db.profiles.createIndex({ 
  clubId: 1, 
  "stats.averageScore": -1,
  isActive: 1 
})
```

### Sessions Collection Indexes
```javascript
db.sessions.createIndex({ userId: 1, isActive: 1 })
db.sessions.createIndex({ sessionId: 1 }, { unique: true })
db.sessions.createIndex({ expiresAt: 1 })
db.sessions.createIndex({ "deviceInfo.deviceId": 1 })
```

### Recovery Tokens Indexes
```javascript
db.recovery_tokens.createIndex({ token: 1 }, { unique: true })
db.recovery_tokens.createIndex({ userId: 1 })
db.recovery_tokens.createIndex({ expiresAt: 1 })
```

## Storage Buckets

### 1. Avatars Bucket (`avatars`)
```json
{
  "id": "avatars",
  "name": "User Avatars",
  "permissions": [
    "read(\"any\")",
    "create(\"users\")",
    "update(\"users\")",
    "delete(\"users\")"
  ],
  "fileSecurity": true,
  "enabled": true,
  "maximumFileSize": 2097152,
  "allowedFileExtensions": ["jpg", "jpeg", "png", "webp"],
  "compression": "gzip",
  "encryption": true,
  "antivirus": true
}
```

### 2. Club Logos Bucket (`club_logos`)
```json
{
  "id": "club_logos",
  "name": "Club Logos",
  "permissions": [
    "read(\"any\")",
    "create(\"users\")",
    "update(\"users\")",
    "delete(\"users\")"
  ],
  "fileSecurity": true,
  "enabled": true,
  "maximumFileSize": 1048576,
  "allowedFileExtensions": ["jpg", "jpeg", "png", "svg", "webp"],
  "compression": "gzip",
  "encryption": true,
  "antivirus": true
}
```

## Data Validation Rules

### Email Validation
- RFC 5322 compliant
- Maximum 254 characters
- Domain validation required
- Disposable email detection

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Maximum 128 characters
- No common passwords (dictionary check)

### Profile Data Validation
- Display names: 2-128 characters, alphanumeric + spaces
- Bio: Maximum 500 characters, HTML stripped
- Country codes: ISO 3166-1 alpha-2 validation
- Phone numbers: E.164 format validation

## Performance Considerations

### Query Optimization
1. **Profile Queries**: Indexed on userId, clubId, and stats fields
2. **Session Lookups**: Indexed on sessionId and userId combinations
3. **Club Searches**: Indexed on name, country, and member count
4. **Leaderboards**: Compound indexes for efficient ranking queries

### Caching Strategy
1. **Profile Data**: 5-minute cache for public profiles
2. **Club Information**: 15-minute cache for club details
3. **Statistics**: 1-hour cache for aggregated stats
4. **Session Data**: No caching for security

### Data Archival
1. **Expired Sessions**: Auto-delete after 7 days
2. **Used Recovery Tokens**: Auto-delete after 24 hours
3. **Audit Logs**: Archive after 90 days, retain for 2 years

## Security Measures

### Data Protection
1. **Encryption**: All data encrypted at rest and in transit
2. **PII Masking**: IP addresses and sensitive data hashed
3. **Access Controls**: Role-based permissions on all collections
4. **Rate Limiting**: Applied to all user-facing endpoints

### Compliance
1. **GDPR**: Right to deletion, data portability
2. **Privacy**: Minimal data collection, opt-in preferences
3. **Audit Trail**: Complete action logging for security events

This schema design ensures scalability, performance, and security while supporting all Epic 1 requirements for user management and authentication.