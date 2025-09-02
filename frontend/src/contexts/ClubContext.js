"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import clubTeamsService from "@/services/clubTeamsService";

const ClubContext = createContext({});

export const useClub = () => {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error("useClub must be used within a ClubProvider");
  }
  return context;
};

export const ClubProvider = ({ children }) => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [userClubs, setUserClubs] = useState([]);
  const [currentClub, setCurrentClub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user's clubs when user changes
  useEffect(() => {
    if (user && user.$id) {
      loadUserClubs();
    } else {
      setUserClubs([]);
    }
  }, [user]);

  // Load all clubs
  const loadClubs = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await clubTeamsService.listClubs(filters);
      setClubs(response.documents);
      return response;
    } catch (error) {
      console.error("Error loading clubs:", error);
      setError(error.message);
      return { documents: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user's clubs
  const loadUserClubs = useCallback(async () => {
    if (!user?.$id) return;
    
    try {
      setLoading(true);
      const response = await clubTeamsService.getUserClubs(user.$id);
      setUserClubs(response.documents);
      return response;
    } catch (error) {
      console.error("Error loading user clubs:", error);
      setError(error.message);
      return { documents: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load a specific club
  const loadClub = useCallback(async (clubId) => {
    try {
      setLoading(true);
      setError(null);
      const club = await clubTeamsService.getClub(clubId);
      setCurrentClub(club);
      return club;
    } catch (error) {
      console.error("Error loading club:", error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new club
  const createClub = useCallback(async (clubData) => {
    if (!user?.$id) {
      throw new Error("You must be logged in to create a club");
    }
    
    try {
      setLoading(true);
      setError(null);
      const result = await clubTeamsService.createClub(clubData, user.$id);
      
      // Refresh user's clubs
      await loadUserClubs();
      
      return result;
    } catch (error) {
      console.error("Error creating club:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, loadUserClubs]);

  // Join a club
  const joinClub = useCallback(async (clubId) => {
    if (!user?.$id) {
      throw new Error("You must be logged in to join a club");
    }
    
    try {
      setLoading(true);
      setError(null);
      const membership = await clubTeamsService.joinClub(
        clubId, 
        user.$id,
        user.email
      );
      
      // Refresh user's clubs
      await loadUserClubs();
      
      // Refresh current club if it's the one being joined
      if (currentClub?.$id === clubId) {
        await loadClub(clubId);
      }
      
      return membership;
    } catch (error) {
      console.error("Error joining club:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, loadUserClubs, currentClub, loadClub]);

  // Leave a club
  const leaveClub = useCallback(async (clubId, membershipId) => {
    try {
      setLoading(true);
      setError(null);
      await clubTeamsService.leaveClub(clubId, membershipId);
      
      // Refresh user's clubs
      await loadUserClubs();
      
      // Clear current club if it's the one being left
      if (currentClub?.$id === clubId) {
        setCurrentClub(null);
      }
      
      return true;
    } catch (error) {
      console.error("Error leaving club:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadUserClubs, currentClub]);

  // Update club details
  const updateClub = useCallback(async (clubId, updates) => {
    try {
      setLoading(true);
      setError(null);
      const updatedClub = await clubTeamsService.updateClub(clubId, updates);
      
      // Update current club if it's the one being updated
      if (currentClub?.$id === clubId) {
        setCurrentClub(updatedClub);
      }
      
      // Update in clubs list
      setClubs(prevClubs => 
        prevClubs.map(club => 
          club.$id === clubId ? updatedClub : club
        )
      );
      
      // Update in user clubs list
      setUserClubs(prevClubs => 
        prevClubs.map(club => 
          club.$id === clubId ? updatedClub : club
        )
      );
      
      return updatedClub;
    } catch (error) {
      console.error("Error updating club:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentClub]);

  // Delete a club
  const deleteClub = useCallback(async (clubId) => {
    try {
      setLoading(true);
      setError(null);
      await clubTeamsService.deleteClub(clubId);
      
      // Remove from lists
      setClubs(prevClubs => prevClubs.filter(club => club.$id !== clubId));
      setUserClubs(prevClubs => prevClubs.filter(club => club.$id !== clubId));
      
      // Clear current club if it's the one being deleted
      if (currentClub?.$id === clubId) {
        setCurrentClub(null);
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting club:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentClub]);

  // Invite member to club
  const inviteMember = useCallback(async (clubId, email, role = "member") => {
    try {
      setLoading(true);
      setError(null);
      const membership = await clubTeamsService.inviteMember(clubId, email, role);
      return membership;
    } catch (error) {
      console.error("Error inviting member:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get club members
  const getClubMembers = useCallback(async (clubId) => {
    try {
      setLoading(true);
      setError(null);
      const members = await clubTeamsService.getClubMembers(clubId);
      return members;
    } catch (error) {
      console.error("Error getting club members:", error);
      setError(error.message);
      return { memberships: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get club activities
  const getClubActivities = useCallback(async (clubId, limit = 20) => {
    try {
      const activities = await clubTeamsService.getClubActivities(clubId, limit);
      return activities;
    } catch (error) {
      console.error("Error getting club activities:", error);
      return { documents: [], total: 0 };
    }
  }, []);

  // Get club announcements
  const getClubAnnouncements = useCallback(async (clubId, limit = 10) => {
    try {
      const announcements = await clubTeamsService.getClubAnnouncements(clubId, limit);
      return announcements;
    } catch (error) {
      console.error("Error getting club announcements:", error);
      return { documents: [], total: 0 };
    }
  }, []);

  // Create club announcement
  const createAnnouncement = useCallback(async (clubId, title, content) => {
    if (!user?.$id) {
      throw new Error("You must be logged in to create an announcement");
    }
    
    try {
      setLoading(true);
      setError(null);
      const announcement = await clubTeamsService.createAnnouncement(
        clubId, 
        title, 
        content, 
        user.$id
      );
      return announcement;
    } catch (error) {
      console.error("Error creating announcement:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create club tournament
  const createClubTournament = useCallback(async (clubId, tournamentData) => {
    if (!user?.$id) {
      throw new Error("You must be logged in to create a tournament");
    }
    
    try {
      setLoading(true);
      setError(null);
      const tournament = await clubTeamsService.createClubTournament(clubId, {
        ...tournamentData,
        createdBy: user.$id
      });
      return tournament;
    } catch (error) {
      console.error("Error creating tournament:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get club tournaments
  const getClubTournaments = useCallback(async (clubId) => {
    try {
      const tournaments = await clubTeamsService.getClubTournaments(clubId);
      return tournaments;
    } catch (error) {
      console.error("Error getting club tournaments:", error);
      return { documents: [], total: 0 };
    }
  }, []);

  // Upload club logo
  const uploadClubLogo = useCallback(async (clubId, file) => {
    try {
      setLoading(true);
      setError(null);
      const logoUrl = await clubTeamsService.uploadClubLogo(clubId, file);
      
      // Update current club if it's the one being updated
      if (currentClub?.$id === clubId) {
        setCurrentClub(prev => ({ ...prev, logoUrl }));
      }
      
      return logoUrl;
    } catch (error) {
      console.error("Error uploading club logo:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentClub]);

  // Check if user is member of a club
  const isUserMemberOfClub = useCallback((clubId) => {
    return userClubs.some(club => club.$id === clubId);
  }, [userClubs]);

  // Get user's role in a club
  const getUserRoleInClub = useCallback((clubId) => {
    const club = userClubs.find(c => c.$id === clubId);
    return club?.userRole || null;
  }, [userClubs]);

  const value = {
    clubs,
    userClubs,
    currentClub,
    loading,
    error,
    loadClubs,
    loadUserClubs,
    loadClub,
    createClub,
    joinClub,
    leaveClub,
    updateClub,
    deleteClub,
    inviteMember,
    getClubMembers,
    getClubActivities,
    getClubAnnouncements,
    createAnnouncement,
    createClubTournament,
    getClubTournaments,
    uploadClubLogo,
    isUserMemberOfClub,
    getUserRoleInClub,
    setCurrentClub
  };

  return (
    <ClubContext.Provider value={value}>
      {children}
    </ClubContext.Provider>
  );
};