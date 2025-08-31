const sdk = require('node-appwrite');
const crypto = require('crypto');

/**
 * Dartmaster Authentication Handler Function
 * Handles user registration, login, session management, and email verification
 * 
 * Triggered by:
 * - users.*.create (user registration)
 * - users.*.sessions.*.create (user login)  
 * - users.*.sessions.*.delete (user logout)
 */

// Initialize Appwrite SDK
const client = new sdk.Client();
const account = new sdk.Account(client);
const databases = new sdk.Databases(client);
const users = new sdk.Users(client);
const storage = new sdk.Storage(client);

client
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

// Configuration constants
const CONFIG = {
    DATABASE_ID: process.env.APPWRITE_DATABASE_ID || 'main',
    COLLECTIONS: {
        PROFILES: 'profiles',
        SESSIONS: 'sessions',
        AUDIT_LOGS: 'audit_logs'
    },
    SESSION_DURATION: parseInt(process.env.SESSION_DURATION) || 86400, // 24 hours
    REMEMBER_ME_DURATION: parseInt(process.env.REMEMBER_ME_DURATION) || 2592000, // 30 days
    MAX_SESSIONS_PER_USER: parseInt(process.env.MAX_SESSIONS_PER_USER) || 10
};

/**
 * Main function entry point
 */
module.exports = async ({ req, res, log, error }) => {
    try {
        log('Auth Handler triggered');
        
        // Parse the event data
        const eventType = req.headers['x-appwrite-trigger'];
        const eventData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        
        log(`Event type: ${eventType}`);
        log(`Event data: ${JSON.stringify(eventData)}`);
        
        let result;
        
        switch (eventType) {
            case 'users.*.create':
                result = await handleUserRegistration(eventData, log, error);
                break;
            case 'users.*.sessions.*.create':
                result = await handleSessionCreation(eventData, log, error);
                break;
            case 'users.*.sessions.*.delete':
                result = await handleSessionDeletion(eventData, log, error);
                break;
            default:
                log(`Unhandled event type: ${eventType}`);
                return res.json({ success: false, error: 'Unhandled event type' });
        }
        
        return res.json({ success: true, data: result });
        
    } catch (err) {
        error(`Authentication handler error: ${err.message}`);
        error(`Stack trace: ${err.stack}`);
        return res.json({ success: false, error: err.message }, 500);
    }
};

/**
 * Handle user registration
 * Creates profile and logs audit event
 */
async function handleUserRegistration(eventData, log, error) {
    log('Processing user registration');
    
    const user = eventData;
    const userId = user.$id;
    
    try {
        // Create user profile with default values
        const profileData = {
            userId: userId,
            displayName: user.name || user.email.split('@')[0],
            bio: '',
            avatar: null,
            country: 'US', // Default, user can update
            timezone: null,
            clubId: null,
            clubName: null,
            preferences: JSON.stringify({
                theme: 'light',
                notifications: {
                    email: true,
                    push: true,
                    social: true
                },
                privacy: {
                    profileVisibility: 'public',
                    showStats: true,
                    showActivity: true
                }
            }),
            stats: JSON.stringify({
                totalMatches: 0,
                totalPractice: 0,
                averageScore: 0.0,
                checkoutPercentage: 0.0,
                doublesPercentage: 0.0,
                total180s: 0,
                highestCheckout: 0,
                bestAverage: 0.0,
                lastCalculated: new Date().toISOString()
            }),
            isActive: true
        };
        
        // Create profile document
        const profile = await databases.createDocument(
            CONFIG.DATABASE_ID,
            CONFIG.COLLECTIONS.PROFILES,
            sdk.ID.unique(),
            profileData
        );
        
        log(`Profile created for user ${userId}: ${profile.$id}`);
        
        // Log audit event
        await logAuditEvent({
            userId: userId,
            action: 'user.register',
            resource: 'user',
            details: {
                success: true,
                email: user.email,
                emailVerification: user.emailVerification
            }
        }, log);
        
        // Send welcome email if email verification is not required
        if (!user.emailVerification) {
            await sendWelcomeEmail(user, log);
        }
        
        return { profileId: profile.$id, userId: userId };
        
    } catch (err) {
        error(`Failed to create profile for user ${userId}: ${err.message}`);
        
        // Log failed audit event
        await logAuditEvent({
            userId: userId,
            action: 'user.register',
            resource: 'user',
            details: {
                success: false,
                error: err.message,
                email: user.email
            }
        }, log);
        
        throw err;
    }
}

/**
 * Handle session creation (login)
 * Creates enhanced session record and manages session limits
 */
async function handleSessionCreation(eventData, log, error) {
    log('Processing session creation');
    
    const session = eventData;
    const userId = session.userId;
    
    try {
        // Extract device and location info
        const deviceInfo = await extractDeviceInfo(session, log);
        const locationInfo = await extractLocationInfo(session, log);
        
        // Calculate session expiration
        const rememberMe = session.factors?.includes('remember') || false;
        const duration = rememberMe ? CONFIG.REMEMBER_ME_DURATION : CONFIG.SESSION_DURATION;
        const expiresAt = new Date(Date.now() + duration * 1000).toISOString();
        
        // Create enhanced session record
        const sessionData = {
            userId: userId,
            sessionId: session.$id,
            deviceInfo: JSON.stringify(deviceInfo),
            location: JSON.stringify(locationInfo),
            rememberMe: rememberMe,
            isActive: true,
            lastActivity: new Date().toISOString(),
            expiresAt: expiresAt
        };
        
        const enhancedSession = await databases.createDocument(
            CONFIG.DATABASE_ID,
            CONFIG.COLLECTIONS.SESSIONS,
            sdk.ID.unique(),
            sessionData
        );
        
        log(`Enhanced session created: ${enhancedSession.$id}`);
        
        // Cleanup old sessions if user exceeds limit
        await cleanupUserSessions(userId, log);
        
        // Log audit event
        await logAuditEvent({
            userId: userId,
            action: 'user.login',
            resource: 'session',
            details: {
                success: true,
                sessionId: session.$id,
                rememberMe: rememberMe,
                deviceInfo: deviceInfo,
                ip: hashIP(session.clientIP || ''),
                userAgent: session.clientName || ''
            }
        }, log);
        
        return { 
            sessionId: enhancedSession.$id, 
            expiresAt: expiresAt,
            rememberMe: rememberMe 
        };
        
    } catch (err) {
        error(`Failed to create enhanced session for user ${userId}: ${err.message}`);
        
        // Log failed audit event
        await logAuditEvent({
            userId: userId,
            action: 'user.login',
            resource: 'session',
            details: {
                success: false,
                error: err.message,
                sessionId: session.$id
            }
        }, log);
        
        throw err;
    }
}

/**
 * Handle session deletion (logout)
 * Marks session as inactive and logs audit event
 */
async function handleSessionDeletion(eventData, log, error) {
    log('Processing session deletion');
    
    const session = eventData;
    const userId = session.userId;
    const sessionId = session.$id;
    
    try {
        // Find and deactivate enhanced session
        const sessions = await databases.listDocuments(
            CONFIG.DATABASE_ID,
            CONFIG.COLLECTIONS.SESSIONS,
            [
                sdk.Query.equal('sessionId', sessionId),
                sdk.Query.equal('isActive', true)
            ]
        );
        
        if (sessions.documents.length > 0) {
            const enhancedSession = sessions.documents[0];
            
            await databases.updateDocument(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.SESSIONS,
                enhancedSession.$id,
                { isActive: false }
            );
            
            log(`Session deactivated: ${enhancedSession.$id}`);
        }
        
        // Log audit event
        await logAuditEvent({
            userId: userId,
            action: 'user.logout',
            resource: 'session',
            details: {
                success: true,
                sessionId: sessionId
            }
        }, log);
        
        return { sessionId: sessionId, deactivated: true };
        
    } catch (err) {
        error(`Failed to deactivate session ${sessionId}: ${err.message}`);
        
        // Log failed audit event
        await logAuditEvent({
            userId: userId,
            action: 'user.logout',
            resource: 'session',
            details: {
                success: false,
                error: err.message,
                sessionId: sessionId
            }
        }, log);
        
        throw err;
    }
}

/**
 * Extract device information from session
 */
async function extractDeviceInfo(session, log) {
    const userAgent = session.clientName || session.clientType || 'Unknown';
    
    // Generate device fingerprint
    const deviceId = crypto
        .createHash('sha256')
        .update(`${userAgent}:${session.clientIP || ''}:${session.osName || ''}`)
        .digest('hex')
        .substring(0, 16);
    
    return {
        userAgent: userAgent,
        platform: detectPlatform(userAgent),
        browser: session.clientName || 'Unknown',
        os: session.osName || 'Unknown',
        deviceId: deviceId
    };
}

/**
 * Extract location information from session
 */
async function extractLocationInfo(session, log) {
    const ip = session.clientIP;
    
    if (!ip) {
        return { ip: null, country: null, city: null };
    }
    
    // Hash IP for privacy
    const hashedIP = hashIP(ip);
    
    // In production, you might want to use a geolocation service here
    // For now, we'll just store the hashed IP
    return {
        ip: hashedIP,
        country: session.countryName || null,
        city: null // Would be populated by geolocation service
    };
}

/**
 * Detect platform from user agent
 */
function detectPlatform(userAgent) {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
        return 'tablet';
    } else {
        return 'desktop';
    }
}

/**
 * Hash IP address for privacy
 */
function hashIP(ip) {
    return crypto
        .createHash('sha256')
        .update(ip + (process.env.HASH_SALT || 'default-salt'))
        .digest('hex')
        .substring(0, 16);
}

/**
 * Clean up old sessions for user if exceeding limit
 */
async function cleanupUserSessions(userId, log) {
    try {
        const sessions = await databases.listDocuments(
            CONFIG.DATABASE_ID,
            CONFIG.COLLECTIONS.SESSIONS,
            [
                sdk.Query.equal('userId', userId),
                sdk.Query.equal('isActive', true),
                sdk.Query.orderDesc('lastActivity'),
                sdk.Query.limit(100)
            ]
        );
        
        if (sessions.documents.length > CONFIG.MAX_SESSIONS_PER_USER) {
            const sessionsToDeactivate = sessions.documents.slice(CONFIG.MAX_SESSIONS_PER_USER);
            
            for (const session of sessionsToDeactivate) {
                await databases.updateDocument(
                    CONFIG.DATABASE_ID,
                    CONFIG.COLLECTIONS.SESSIONS,
                    session.$id,
                    { isActive: false }
                );
            }
            
            log(`Deactivated ${sessionsToDeactivate.length} old sessions for user ${userId}`);
        }
        
    } catch (err) {
        log(`Failed to cleanup sessions for user ${userId}: ${err.message}`);
        // Don't throw, as this is cleanup and shouldn't fail the main operation
    }
}

/**
 * Log audit event
 */
async function logAuditEvent(eventData, log) {
    try {
        await databases.createDocument(
            CONFIG.DATABASE_ID,
            CONFIG.COLLECTIONS.AUDIT_LOGS,
            sdk.ID.unique(),
            {
                userId: eventData.userId || null,
                action: eventData.action,
                resource: eventData.resource || null,
                details: JSON.stringify(eventData.details || {}),
                timestamp: new Date().toISOString()
            }
        );
        
        log(`Audit event logged: ${eventData.action}`);
        
    } catch (err) {
        log(`Failed to log audit event: ${err.message}`);
        // Don't throw, as audit logging shouldn't fail the main operation
    }
}

/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(user, log) {
    try {
        // In production, integrate with your email service
        log(`Would send welcome email to ${user.email}`);
        
        // Example integration with messaging service:
        // const messaging = new sdk.Messaging(client);
        // await messaging.createEmail(...);
        
    } catch (err) {
        log(`Failed to send welcome email: ${err.message}`);
        // Don't throw, as email sending shouldn't fail the registration
    }
}