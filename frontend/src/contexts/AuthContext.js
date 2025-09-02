"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { ID } from "appwrite";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      // User is not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Create session
      const session = await account.createEmailPasswordSession(email, password);
      
      // Get user details
      const currentUser = await account.get();
      setUser(currentUser);
      
      return { success: true, user: currentUser };
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        error: error.message || "Invalid email or password" 
      };
    }
  };

  const register = async (email, password, name) => {
    try {
      // Create new user account
      const newUser = await account.create(
        ID.unique(),
        email,
        password,
        name
      );
      
      // Create session after registration
      await account.createEmailPasswordSession(email, password);
      
      // Get user details
      const currentUser = await account.get();
      setUser(currentUser);
      
      // Note: Profile creation will be handled in the profile setup flow
      // This allows users to choose their username after registration
      
      return { success: true, user: currentUser, needsProfile: true };
    } catch (error) {
      console.error("Registration error:", error);
      
      // Handle specific error cases
      if (error.code === 409) {
        return { 
          success: false, 
          error: "An account with this email already exists" 
        };
      }
      
      return { 
        success: false, 
        error: error.message || "Registration failed. Please try again." 
      };
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { 
        success: false, 
        error: error.message || "Logout failed" 
      };
    }
  };

  const updateProfile = async (data) => {
    try {
      const updatedUser = await account.updateName(data.name);
      
      // Update preferences if provided
      if (data.prefs) {
        await account.updatePrefs(data.prefs);
      }
      
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error("Update profile error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to update profile" 
      };
    }
  };

  const sendPasswordRecovery = async (email) => {
    try {
      await account.createRecovery(
        email,
        `${window.location.origin}/auth/reset-password`
      );
      return { success: true };
    } catch (error) {
      console.error("Password recovery error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to send recovery email" 
      };
    }
  };

  const resetPassword = async (userId, secret, password) => {
    try {
      await account.updateRecovery(userId, secret, password);
      return { success: true };
    } catch (error) {
      console.error("Password reset error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to reset password" 
      };
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Initiate OAuth2 login with Google
      const successUrl = `${window.location.origin}/auth/callback`;
      const failureUrl = `${window.location.origin}/auth/login?error=oauth_failed`;
      
      await account.createOAuth2Session(
        'google',
        successUrl,
        failureUrl,
        ['profile', 'email']
      );
      
      // The user will be redirected to Google
      return { success: true };
    } catch (error) {
      console.error("Google login error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to login with Google" 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    sendPasswordRecovery,
    resetPassword,
    loginWithGoogle,
    checkUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};