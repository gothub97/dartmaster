/**
 * Dartmaster Authentication Client Library
 * Handles all authentication operations with Appwrite
 */

import { Client, Account, Databases, ID, Query } from 'appwrite';

class DartmasterAuth {
    constructor(config) {
        this.client = new Client()
            .setEndpoint(config.endpoint)
            .setProject(config.projectId);
            
        this.account = new Account(this.client);
        this.databases = new Databases(this.client);
        this.config = config;
        
        // Initialize session monitoring
        this.sessionCheckInterval = null;
        this.currentUser = null;
        this.currentSession = null;
    }

    /**
     * User Registration Flow
     */
    async register({ email, password, name, country = 'US' }) {
        try {
            // Validate inputs
            this.validateEmail(email);
            this.validatePassword(password);
            this.validateName(name);
            
            // Create user account
            const user = await this.account.create(
                ID.unique(),
                email,
                password,
                name
            );
            
            // Automatically log in the user
            const session = await this.login({ email, password });
            
            return {
                success: true,
                user: user,
                session: session,
                message: 'Registration successful'
            };
            
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: this.parseError(error),
                message: this.getErrorMessage(error)
            };
        }
    }

    /**
     * User Login Flow
     */
    async login({ email, password, rememberMe = false }) {
        try {
            // Validate inputs
            this.validateEmail(email);
            this.validatePassword(password);
            
            // Create session
            const session = await this.account.createEmailSession(email, password);
            
            // Get user details
            const user = await this.account.get();
            
            // Get user profile
            const profile = await this.getUserProfile(user.$id);
            
            // Store session info
            this.currentUser = user;
            this.currentSession = session;
            
            // Setup session monitoring
            this.startSessionMonitoring();
            
            // Store remember me preference
            if (rememberMe) {
                localStorage.setItem('dartmaster_remember_me', 'true');
            }
            
            // Dispatch login event
            this.dispatchAuthEvent('login', { user, profile, session });
            
            return {
                success: true,
                user: user,
                profile: profile,
                session: session,
                message: 'Login successful'
            };
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Clear any stored session info
            this.clearAuthState();
            
            return {
                success: false,
                error: this.parseError(error),
                message: this.getErrorMessage(error)
            };
        }
    }

    /**
     * User Logout Flow
     */
    async logout() {
        try {
            // Delete current session
            if (this.currentSession) {
                await this.account.deleteSession(this.currentSession.$id);
            }
            
            // Clear auth state
            this.clearAuthState();
            
            // Dispatch logout event
            this.dispatchAuthEvent('logout');
            
            return {
                success: true,
                message: 'Logout successful'
            };
            
        } catch (error) {
            console.error('Logout error:', error);
            
            // Clear auth state even if logout fails
            this.clearAuthState();
            
            return {
                success: false,
                error: this.parseError(error),
                message: 'Logout completed with warnings'
            };
        }
    }

    /**
     * Send Email Verification
     */
    async sendEmailVerification() {
        try {
            await this.account.createVerification(
                `${window.location.origin}/verify-email`
            );
            
            return {
                success: true,
                message: 'Verification email sent'
            };
            
        } catch (error) {
            console.error('Email verification error:', error);
            return {
                success: false,
                error: this.parseError(error),
                message: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Verify Email with Token
     */
    async verifyEmail(userId, secret) {
        try {
            await this.account.updateVerification(userId, secret);
            
            // Refresh user data
            const user = await this.account.get();
            this.currentUser = user;
            
            this.dispatchAuthEvent('email_verified', { user });
            
            return {
                success: true,
                user: user,
                message: 'Email verified successfully'
            };
            
        } catch (error) {
            console.error('Email verification error:', error);
            return {
                success: false,
                error: this.parseError(error),
                message: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Send Password Recovery Email
     */
    async sendPasswordRecovery(email) {
        try {
            this.validateEmail(email);
            
            await this.account.createRecovery(
                email,
                `${window.location.origin}/reset-password`
            );
            
            return {
                success: true,
                message: 'Recovery email sent'
            };
            
        } catch (error) {
            console.error('Password recovery error:', error);
            return {
                success: false,
                error: this.parseError(error),
                message: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Reset Password with Token
     */
    async resetPassword(userId, secret, newPassword, confirmPassword) {
        try {
            // Validate passwords
            this.validatePassword(newPassword);
            
            if (newPassword !== confirmPassword) {
                throw new Error('Passwords do not match');
            }
            
            await this.account.updateRecovery(userId, secret, newPassword, confirmPassword);
            
            return {
                success: true,
                message: 'Password reset successfully'
            };
            
        } catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                error: this.parseError(error),
                message: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Get Current User Session
     */
    async getCurrentSession() {
        try {
            const user = await this.account.get();
            const profile = await this.getUserProfile(user.$id);
            
            this.currentUser = user;
            
            return {
                success: true,
                user: user,
                profile: profile,
                authenticated: true
            };
            
        } catch (error) {
            // User not authenticated
            this.clearAuthState();
            
            return {
                success: false,
                authenticated: false,
                message: 'No active session'
            };
        }
    }

    /**
     * Update Password
     */
    async updatePassword(currentPassword, newPassword) {
        try {
            this.validatePassword(newPassword);
            
            await this.account.updatePassword(newPassword, currentPassword);
            
            return {
                success: true,
                message: 'Password updated successfully'
            };
            
        } catch (error) {
            console.error('Password update error:', error);
            return {
                success: false,
                error: this.parseError(error),
                message: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Update Email
     */
    async updateEmail(newEmail, password) {
        try {
            this.validateEmail(newEmail);
            this.validatePassword(password);
            
            const user = await this.account.updateEmail(newEmail, password);
            this.currentUser = user;
            
            return {
                success: true,
                user: user,
                message: 'Email updated successfully'
            };
            
        } catch (error) {
            console.error('Email update error:', error);
            return {
                success: false,
                error: this.parseError(error),
                message: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Get User Profile
     */
    async getUserProfile(userId) {
        try {
            const profiles = await this.databases.listDocuments(
                this.config.databaseId,
                this.config.collections.profiles,
                [Query.equal('userId', userId)]
            );
            
            if (profiles.documents.length === 0) {
                throw new Error('Profile not found');
            }
            
            const profile = profiles.documents[0];
            
            // Parse JSON fields
            profile.preferences = JSON.parse(profile.preferences || '{}');
            profile.stats = JSON.parse(profile.stats || '{}');
            
            return profile;
            
        } catch (error) {
            console.error('Profile fetch error:', error);
            throw error;
        }
    }

    /**
     * Session Monitoring
     */
    startSessionMonitoring() {
        // Clear existing interval
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }
        
        // Check session every 5 minutes
        this.sessionCheckInterval = setInterval(async () => {
            try {
                await this.account.get();
            } catch (error) {
                // Session expired or invalid
                this.handleSessionExpiry();
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Handle Session Expiry
     */
    handleSessionExpiry() {
        this.clearAuthState();
        this.dispatchAuthEvent('session_expired');
        
        // Redirect to login if configured
        if (this.config.redirectOnExpiry) {
            window.location.href = this.config.loginUrl || '/login';
        }
    }

    /**
     * Clear Authentication State
     */
    clearAuthState() {
        this.currentUser = null;
        this.currentSession = null;
        
        // Clear session monitoring
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
            this.sessionCheckInterval = null;
        }
        
        // Clear stored data
        localStorage.removeItem('dartmaster_remember_me');
    }

    /**
     * Dispatch Authentication Events
     */
    dispatchAuthEvent(type, data = {}) {
        const event = new CustomEvent(`dartmaster:auth:${type}`, {
            detail: { ...data, timestamp: new Date().toISOString() }
        });
        
        window.dispatchEvent(event);
    }

    /**
     * Input Validation Methods
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            throw new Error('Invalid email address');
        }
        if (email.length > 254) {
            throw new Error('Email address too long');
        }
    }

    validatePassword(password) {
        if (!password) {
            throw new Error('Password is required');
        }
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        if (password.length > 128) {
            throw new Error('Password too long');
        }
        if (!/(?=.*[a-z])/.test(password)) {
            throw new Error('Password must contain lowercase letters');
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            throw new Error('Password must contain uppercase letters');
        }
        if (!/(?=.*\d)/.test(password)) {
            throw new Error('Password must contain numbers');
        }
        if (!/(?=.*[@$!%*?&])/.test(password)) {
            throw new Error('Password must contain special characters');
        }
    }

    validateName(name) {
        if (!name || name.trim().length < 2) {
            throw new Error('Name must be at least 2 characters');
        }
        if (name.length > 128) {
            throw new Error('Name too long');
        }
        if (!/^[a-zA-Z0-9\s-_.]+$/.test(name)) {
            throw new Error('Name contains invalid characters');
        }
    }

    /**
     * Error Handling
     */
    parseError(error) {
        if (error.type) {
            return {
                type: error.type,
                code: error.code,
                message: error.message
            };
        }
        
        return {
            type: 'general_error',
            message: error.message || 'An unexpected error occurred'
        };
    }

    getErrorMessage(error) {
        const errorMessages = {
            'user_already_exists': 'An account with this email already exists',
            'user_invalid_credentials': 'Invalid email or password',
            'user_blocked': 'Your account has been blocked',
            'user_invalid_token': 'Invalid or expired token',
            'user_email_not_whitelisted': 'Email domain not allowed',
            'password_recently_used': 'Password was recently used',
            'password_personal_data': 'Password contains personal information'
        };
        
        return errorMessages[error.type] || error.message || 'An error occurred';
    }
}

export default DartmasterAuth;