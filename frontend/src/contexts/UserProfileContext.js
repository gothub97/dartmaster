"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { databases, storage } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { ID, Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const PROFILES_COLLECTION = "user_profiles";
const AVATARS_BUCKET = "avatars";

const UserProfileContext = createContext({});

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};

export const UserProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileCache, setProfileCache] = useState({});

  // Load current user's profile
  useEffect(() => {
    console.log("🔄 useEffect triggered. user:", user?.$id, user?.name);
    if (user && user.$id) {
      console.log("✅ Loading profile for user:", user.$id);
      loadUserProfile(user.$id);
    } else {
      console.log("❌ No user found, clearing profile");
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  // Load a user profile by userId
  const loadUserProfile = async (userId) => {
    try {
      setLoading(true);
      
      console.log("🔍 loadUserProfile called with userId:", userId);
      console.log("📊 DATABASE_ID:", DATABASE_ID);
      console.log("📁 PROFILES_COLLECTION:", PROFILES_COLLECTION);
      
      // Check cache first
      if (profileCache[userId]) {
        console.log("✅ Found profile in cache");
        setProfile(profileCache[userId]);
        setLoading(false);
        return profileCache[userId];
      }

      console.log("🔎 Querying database for profile...");
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          PROFILES_COLLECTION,
          [Query.equal("userId", userId)]
        );
        
        console.log("📦 Database response:", response);
        console.log("📝 Documents found:", response.documents.length);
        
        if (response.documents.length > 0) {
          const userProfile = response.documents[0];
          
          console.log("Loading profile for user:", userId, "Avatar URL:", userProfile.avatarUrl);
          
          // Parse JSON fields
          if (userProfile.stats) {
            try {
              userProfile.stats = JSON.parse(userProfile.stats);
            } catch (e) {
              userProfile.stats = {};
            }
          }
          
          if (userProfile.socialLinks) {
            try {
              userProfile.socialLinks = JSON.parse(userProfile.socialLinks);
            } catch (e) {
              userProfile.socialLinks = {};
            }
          }

          // Update cache
          setProfileCache(prev => ({ ...prev, [userId]: userProfile }));
          
          if (userId === user?.$id) {
            setProfile(userProfile);
          }
          
          return userProfile;
        } else {
          console.log("❌ No profile documents found for userId:", userId);
        }
        
        return null;
      } catch (dbError) {
        console.error("❌ Database query failed:", dbError);
        throw dbError;
      }
    } catch (error) {
      console.error("❌ Error loading profile:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create user profile
  const createProfile = async (profileData) => {
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      // Check if username is available
      if (profileData.username) {
        const isAvailable = await checkUsernameAvailability(profileData.username);
        if (!isAvailable) {
          return { success: false, error: "Username already taken" };
        }
      }

      // Prepare data
      const data = {
        userId: user.$id,
        username: profileData.username,
        bio: profileData.bio || "",
        country: profileData.country || "",
        club: profileData.club || "",
        avatarUrl: profileData.avatarUrl || "",
        backgroundUrl: profileData.backgroundUrl || "",
        stats: JSON.stringify(profileData.stats || {}),
        visibility: profileData.visibility || "public",
        socialLinks: JSON.stringify(profileData.socialLinks || {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        PROFILES_COLLECTION,
        user.$id,  // Use userId as document ID to prevent duplicates
        data
      );

      // Parse JSON fields back
      response.stats = JSON.parse(response.stats || "{}");
      response.socialLinks = JSON.parse(response.socialLinks || "{}");

      setProfile(response);
      setProfileCache(prev => ({ ...prev, [user.$id]: response }));

      return { success: true, profile: response };
    } catch (error) {
      console.error("Error creating profile:", error);
      return { success: false, error: error.message };
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    console.log("🔄 updateProfile called with updates:", updates);
    console.log("👤 user:", user?.$id);
    console.log("📋 profile:", profile?.$id, profile?.username);
    
    if (!user || !profile) {
      console.log("❌ updateProfile failed: No profile found. user:", !!user, "profile:", !!profile);
      return { success: false, error: "No profile found" };
    }

    try {
      // Check username availability if changing
      if (updates.username && updates.username !== profile.username) {
        const isAvailable = await checkUsernameAvailability(updates.username);
        if (!isAvailable) {
          return { success: false, error: "Username already taken" };
        }
      }

      // Prepare update data
      const updateData = { ...updates };
      
      // Stringify JSON fields
      if (updateData.stats) {
        updateData.stats = JSON.stringify(updateData.stats);
      }
      if (updateData.socialLinks) {
        updateData.socialLinks = JSON.stringify(updateData.socialLinks);
      }
      
      updateData.updatedAt = new Date().toISOString();

      const response = await databases.updateDocument(
        DATABASE_ID,
        PROFILES_COLLECTION,
        profile.$id,
        updateData
      );

      // Parse JSON fields back
      response.stats = JSON.parse(response.stats || "{}");
      response.socialLinks = JSON.parse(response.socialLinks || "{}");

      setProfile(response);
      setProfileCache(prev => ({ ...prev, [user.$id]: response }));

      return { success: true, profile: response };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, error: error.message };
    }
  };

  // Check username availability
  const checkUsernameAvailability = async (username) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION,
        [Query.equal("username", username)]
      );
      
      // Username is available if no documents found, or if it's the current user's username
      return response.documents.length === 0 || 
             (response.documents.length === 1 && response.documents[0].userId === user?.$id);
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  };

  // Upload avatar
  const uploadAvatar = async (file) => {
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      // Delete old avatar if exists
      if (profile?.avatarUrl) {
        const oldFileId = profile.avatarUrl.split('/').pop().split('?')[0];
        try {
          await storage.deleteFile(AVATARS_BUCKET, oldFileId);
        } catch (e) {
          // Ignore deletion errors
        }
      }

      // Upload new avatar
      const response = await storage.createFile(
        AVATARS_BUCKET,
        ID.unique(),
        file
      );

      // Get file URL - construct the direct URL
      const fileUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${AVATARS_BUCKET}/files/${response.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

      console.log("Avatar uploaded successfully. File ID:", response.$id, "URL:", fileUrl);

      // Update profile with new avatar URL
      const updateResult = await updateProfile({ avatarUrl: fileUrl });
      
      return updateResult;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return { success: false, error: error.message };
    }
  };

  // Load profile by username
  const loadProfileByUsername = async (username) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION,
        [Query.equal("username", username)]
      );

      if (response.documents.length > 0) {
        const userProfile = response.documents[0];
        
        // Parse JSON fields
        if (userProfile.stats) {
          try {
            userProfile.stats = JSON.parse(userProfile.stats);
          } catch (e) {
            userProfile.stats = {};
          }
        }
        
        if (userProfile.socialLinks) {
          try {
            userProfile.socialLinks = JSON.parse(userProfile.socialLinks);
          } catch (e) {
            userProfile.socialLinks = {};
          }
        }

        return userProfile;
      }
      
      return null;
    } catch (error) {
      console.error("Error loading profile by username:", error);
      return null;
    }
  };

  // Search profiles
  const searchProfiles = async (searchTerm, filters = {}) => {
    try {
      const queries = [];
      
      // Add visibility filter (only show public profiles)
      queries.push(Query.equal("visibility", "public"));
      
      // Add search filters
      if (searchTerm) {
        queries.push(Query.search("username", searchTerm));
      }
      
      if (filters.country) {
        queries.push(Query.equal("country", filters.country));
      }
      
      if (filters.club) {
        queries.push(Query.equal("club", filters.club));
      }
      
      // Add pagination
      if (filters.limit) {
        queries.push(Query.limit(filters.limit));
      }
      
      if (filters.offset) {
        queries.push(Query.offset(filters.offset));
      }
      
      // Add ordering
      queries.push(Query.orderDesc("$createdAt"));

      const response = await databases.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION,
        queries
      );

      // Parse JSON fields for all profiles
      const profiles = response.documents.map(profile => {
        if (profile.stats) {
          try {
            profile.stats = JSON.parse(profile.stats);
          } catch (e) {
            profile.stats = {};
          }
        }
        
        if (profile.socialLinks) {
          try {
            profile.socialLinks = JSON.parse(profile.socialLinks);
          } catch (e) {
            profile.socialLinks = {};
          }
        }
        
        return profile;
      });

      return {
        profiles,
        total: response.total
      };
    } catch (error) {
      console.error("Error searching profiles:", error);
      return { profiles: [], total: 0 };
    }
  };

  // Calculate stats from matches
  const calculateUserStats = async (userId) => {
    try {
      // Get all matches for the user
      const matchesResponse = await databases.listDocuments(
        DATABASE_ID,
        "matches",
        [
          Query.equal("players", userId),
          Query.equal("status", "finished")
        ]
      );

      const matches = matchesResponse.documents;
      
      const stats = {
        gamesPlayed: matches.length,
        wins: 0,
        losses: 0,
        draws: 0,
        totalScore: 0,
        highestCheckout: 0,
        bullseyes: 0,
        averageScore: 0,
        winRate: 0
      };

      matches.forEach(match => {
        if (match.winner === userId) {
          stats.wins++;
        } else if (match.winner) {
          stats.losses++;
        } else {
          stats.draws++;
        }

        // Parse game state to get detailed stats
        if (match.gameState) {
          try {
            const gameState = JSON.parse(match.gameState);
            // Calculate more detailed stats from gameState
            // This would depend on your game state structure
          } catch (e) {
            // Ignore parsing errors
          }
        }
      });

      if (stats.gamesPlayed > 0) {
        stats.winRate = Math.round((stats.wins / stats.gamesPlayed) * 100);
        stats.averageScore = Math.round(stats.totalScore / stats.gamesPlayed);
      }

      return stats;
    } catch (error) {
      console.error("Error calculating stats:", error);
      return null;
    }
  };

  const value = {
    profile,
    loading,
    createProfile,
    updateProfile,
    uploadAvatar,
    checkUsernameAvailability,
    loadUserProfile,
    loadProfileByUsername,
    searchProfiles,
    calculateUserStats
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};