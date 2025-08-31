# Dartmaster Security Rules and Permissions

## Overview
This document defines the comprehensive security model for Dartmaster, ensuring data protection, user privacy, and system integrity while maintaining optimal performance for 1000+ concurrent users.

## Permission System Architecture

### Role-Based Access Control (RBAC)
- **any**: Any authenticated or unauthenticated user
- **users**: Any authenticated user
- **user:{userId}**: Specific authenticated user
- **team:{teamId}**: Team members (for clubs/organizations)
- **label:{label}**: Users with specific labels/roles

### Attribute-Based Access Control (ABAC)
- Dynamic permissions based on document attributes
- Resource ownership validation
- Contextual access based on relationships

## Collection Permissions

### 1. Profiles Collection (`profiles`)
**Security Level**: High - Contains personal information

```javascript
// Read Permissions
"read(\"any\")" // Public profiles visible to all
"read(\"user:{userId}\")" // User can read own profile (private data)

// Write Permissions  
"create(\"users\")" // Authenticated users can create profiles
"update(\"user:{profiles.userId}\")" // Only profile owner can update
"delete(\"user:{profiles.userId}\")" // Only profile owner can delete

// Document Security Rules
{
  // Public fields (visible to all users)
  publicFields: [
    "displayName", 
    "avatar", 
    "country", 
    "clubId", 
    "clubName",
    "stats" // If privacy.showStats is true
  ],
  
  // Private fields (visible only to owner)
  privateFields: [
    "bio", // If privacy.profileVisibility is 'private'
    "timezone",
    "preferences",
    "stats" // If privacy.showStats is false
  ],
  
  // System fields (read-only)
  systemFields: [
    "$id",
    "$createdAt", 
    "$updatedAt",
    "userId"
  ]
}
```

#### Profile Privacy Implementation
```javascript
// Dynamic read permissions based on privacy settings
function getProfileReadPermissions(profile) {
  const basePermissions = [`user:${profile.userId}`];
  
  if (profile.preferences.privacy.profileVisibility === 'public') {
    basePermissions.push('any');
  } else if (profile.preferences.privacy.profileVisibility === 'friends') {
    // Add friend-based permissions (future implementation)
    basePermissions.push(`friends:${profile.userId}`);
  }
  // 'private' profiles only accessible by owner
  
  return basePermissions;
}
```

### 2. Sessions Collection (`sessions`)
**Security Level**: Critical - Contains authentication data

```javascript
// Read/Write Permissions
"read(\"user:{sessions.userId}\")" // Only session owner
"create(\"user:{sessions.userId}\")" // Only for own sessions
"update(\"user:{sessions.userId}\")" // Only session owner
"delete(\"user:{sessions.userId}\")" // Only session owner

// Additional Security Rules
{
  maxSessionsPerUser: 10,
  sessionTimeout: 86400, // 24 hours
  rememberMeTimeout: 2592000, // 30 days
  
  // Auto-cleanup expired sessions
  cleanupSchedule: "0 2 * * *", // Daily at 2 AM
  
  // Session validation rules
  deviceFingerprinting: true,
  ipValidation: true,
  userAgentValidation: true
}
```

### 3. Clubs Collection (`clubs`)
**Security Level**: Medium - Semi-public information

```javascript
// Read Permissions
"read(\"any\")" // Public clubs visible to all
"read(\"users\")" // Private clubs visible to authenticated users

// Write Permissions
"create(\"users\")" // Authenticated users can create clubs
"update(\"user:{clubs.adminIds}\")" // Only club admins can update
"delete(\"user:{clubs.adminIds}\")" // Only club admins can delete

// Role-based permissions
{
  adminRights: [
    "update:club",
    "delete:club", 
    "manage:members",
    "create:events",
    "moderate:discussions"
  ],
  
  memberRights: [
    "read:club",
    "participate:events",
    "post:discussions"
  ],
  
  guestRights: [
    "read:public:club",
    "view:events"
  ]
}
```

### 4. Recovery Tokens Collection (`recovery_tokens`)
**Security Level**: Critical - Password reset tokens

```javascript
// Permissions: System only - No direct user access
"read()" // No read permissions
"create()" // No create permissions  
"update()" // No update permissions
"delete()" // No delete permissions

// Server-side validation only
{
  tokenGeneration: {
    algorithm: "crypto.randomBytes",
    length: 32,
    encoding: "hex"
  },
  
  tokenStorage: {
    hashed: true,
    algorithm: "sha256",
    saltRounds: 12
  },
  
  tokenValidation: {
    maxAge: 3600, // 1 hour
    singleUse: true,
    emailVerification: true
  }
}
```

### 5. Audit Logs Collection (`audit_logs`)
**Security Level**: Critical - Security monitoring

```javascript
// Permissions: System only
"read()" // No direct user access
"create()" // System-generated only
"update()" // Immutable records
"delete()" // Retention-based only

// Audit event types
{
  authEvents: [
    "user.register",
    "user.login", 
    "user.logout",
    "user.password.reset",
    "user.email.verify",
    "session.create",
    "session.delete"
  ],
  
  profileEvents: [
    "profile.create",
    "profile.update",
    "profile.delete",
    "avatar.upload",
    "privacy.change"
  ],
  
  securityEvents: [
    "login.failed",
    "token.invalid",
    "permission.denied",
    "rate.limit.exceeded",
    "suspicious.activity"
  ]
}
```

## Storage Bucket Permissions

### 1. Avatars Bucket (`avatars`)
```javascript
{
  permissions: [
    "read(\"any\")", // Public avatars
    "create(\"users\")", // Authenticated users can upload
    "update(\"users\")", // Users can update own avatars
    "delete(\"users\")" // Users can delete own avatars
  ],
  
  securityRules: {
    maxFileSize: 2097152, // 2MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    virusScanning: true,
    contentValidation: true,
    
    // File ownership validation
    ownershipValidation: async (userId, fileId) => {
      const profile = await getProfileByUserId(userId);
      return profile && profile.avatar === fileId;
    }
  }
}
```

### 2. Club Logos Bucket (`club_logos`)
```javascript
{
  permissions: [
    "read(\"any\")", // Public club logos
    "create(\"users\")", // Club admins can upload
    "update(\"users\")", // Club admins can update
    "delete(\"users\")" // Club admins can delete
  ],
  
  securityRules: {
    maxFileSize: 1048576, // 1MB
    allowedTypes: ["image/jpeg", "image/png", "image/svg+xml", "image/webp"],
    
    // Club admin validation
    adminValidation: async (userId, clubId) => {
      const club = await getClubById(clubId);
      return club && club.adminIds.includes(userId);
    }
  }
}
```

## Function Permissions

### 1. Authentication Handler (`auth-handler`)
```javascript
{
  execute: ["users"],
  events: [
    "users.*.create",
    "users.*.sessions.*.create", 
    "users.*.sessions.*.delete"
  ],
  
  permissions: {
    createProfile: true,
    createSession: true,
    auditLog: true,
    sendEmail: true
  }
}
```

### 2. Profile Manager (`profile-manager`)
```javascript
{
  execute: ["users"],
  permissions: {
    readProfiles: "own",
    updateProfiles: "own",
    uploadFiles: true,
    calculateStats: true
  }
}
```

### 3. Password Recovery (`password-recovery`)
```javascript
{
  execute: ["any"], // Public endpoint
  permissions: {
    createRecoveryToken: true,
    sendRecoveryEmail: true,
    validateToken: true,
    updatePassword: true,
    auditLog: true
  },
  
  rateLimiting: {
    requestsPerEmail: 3,
    windowMinutes: 60,
    globalRequestsPerMinute: 10
  }
}
```

## Security Implementation Patterns

### 1. Document-Level Security
```javascript
// Example: Profile privacy check
async function validateProfileAccess(userId, profileId, operation) {
  const profile = await database.getDocument('profiles', profileId);
  
  // Owner has full access
  if (profile.userId === userId) {
    return true;
  }
  
  // Check privacy settings for read operations
  if (operation === 'read') {
    const privacy = JSON.parse(profile.preferences).privacy;
    
    switch (privacy.profileVisibility) {
      case 'public':
        return true;
      case 'friends':
        return await checkFriendship(userId, profile.userId);
      case 'private':
        return false;
    }
  }
  
  // Write operations only for owner
  return false;
}
```

### 2. Rate Limiting Implementation
```javascript
const rateLimiter = {
  // Global rate limits
  global: {
    requests: 1000,
    window: 900000, // 15 minutes
    skipSuccessfulAuth: true
  },
  
  // Per-user rate limits
  perUser: {
    requests: 100,
    window: 900000, // 15 minutes
    keyGenerator: (req) => req.user?.userId || req.ip
  },
  
  // Endpoint-specific limits
  endpoints: {
    '/auth/login': {
      requests: 5,
      window: 900000, // 15 minutes
      skipSuccessfulAuth: false
    },
    '/auth/register': {
      requests: 3,
      window: 3600000, // 1 hour
      skipSuccessfulAuth: false
    },
    '/auth/recover': {
      requests: 3,
      window: 3600000, // 1 hour
      skipSuccessfulAuth: false
    }
  }
};
```

### 3. Data Validation Rules
```javascript
const validationRules = {
  profile: {
    displayName: {
      minLength: 2,
      maxLength: 128,
      pattern: /^[a-zA-Z0-9\s-_]+$/,
      trim: true,
      required: true
    },
    
    bio: {
      maxLength: 500,
      sanitize: true, // Strip HTML
      profanityCheck: true,
      trim: true
    },
    
    country: {
      pattern: /^[A-Z]{2}$/, // ISO 3166-1 alpha-2
      required: true,
      validate: (value) => ISO_COUNTRIES.includes(value)
    }
  },
  
  club: {
    name: {
      minLength: 3,
      maxLength: 128,
      pattern: /^[a-zA-Z0-9\s-_&.]+$/,
      trim: true,
      required: true,
      unique: true
    },
    
    adminIds: {
      minItems: 1,
      maxItems: 10,
      validate: (ids) => ids.every(id => isValidUserId(id))
    }
  }
};
```

## Security Monitoring and Compliance

### 1. Audit Trail Requirements
- All authentication events logged
- Permission denials recorded
- Data access patterns monitored
- Failed attempts tracked
- Rate limit violations logged

### 2. Data Protection Measures
- PII encryption at rest
- IP address hashing
- Secure token generation
- Password hashing (Argon2)
- File content validation

### 3. Compliance Features
- GDPR data portability
- Right to deletion
- Consent management
- Data minimization
- Purpose limitation

This security model ensures robust protection while maintaining performance and usability for the Dartmaster platform.