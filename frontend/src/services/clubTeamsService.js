import { teams, databases, storage } from "@/lib/appwrite";
import { ID, Query, Permission, Role } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "dartmaster_db";
const CLUBS_COLLECTION = "clubs";
const CLUB_TOURNAMENTS_COLLECTION = "club_tournaments";
const CLUB_ACTIVITIES_COLLECTION = "club_activities";
const CLUB_ANNOUNCEMENTS_COLLECTION = "club_announcements";
const CLUB_LOGOS_BUCKET = "club_logos";

class ClubTeamsService {
  // Create a new club with Appwrite Team
  async createClub(clubData, userId) {
    try {
      // 1. Create Appwrite Team (user who creates becomes owner automatically)
      const team = await teams.create(
        ID.unique(),
        clubData.name
      );
      
      // 2. Create club document in database
      const club = await databases.createDocument(
        DATABASE_ID,
        CLUBS_COLLECTION,
        ID.unique(),
        {
          teamId: team.$id,
          name: clubData.name,
          description: clubData.description || "",
          country: clubData.country || "",
          city: clubData.city || "",
          logoUrl: clubData.logoUrl || null,
          isPublic: clubData.isPublic !== false,
          joinMethod: clubData.joinMethod || "open", // open, request, invite
          memberCount: 1,
          clubStats: JSON.stringify({
            totalGames: 0,
            avgAccuracy: 0,
            totalTrophies: 0,
            weeklyActive: 0
          }),
          settings: JSON.stringify({
            minLevel: 0,
            maxMembers: 100,
            allowGuestPlay: false,
            tournamentFrequency: "weekly",
            captains: [],  // Track captain user IDs separately
            moderators: []  // Track moderator user IDs separately
          }),
          createdBy: userId,
          createdAt: new Date().toISOString()
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.team(team.$id, "owner")),
          Permission.update(Role.team(team.$id)),
          Permission.delete(Role.team(team.$id, "owner"))
        ]
      );
      
      // 3. Create initial activity (skip if it fails since it's non-critical)
      try {
        await this.addClubActivity(club.$id, team.$id, "club_created", userId, {
          message: "Club was created"
        });
      } catch (activityError) {
        console.log("Could not create initial activity:", activityError);
      }
      
      return { team, club };
    } catch (error) {
      console.error("Error creating club:", error);
      throw error;
    }
  }

  // Get club by ID
  async getClub(clubId) {
    try {
      const club = await databases.getDocument(
        DATABASE_ID,
        CLUBS_COLLECTION,
        clubId
      );
      
      // Parse JSON fields
      if (club.clubStats) {
        club.clubStats = JSON.parse(club.clubStats);
      }
      if (club.settings) {
        club.settings = JSON.parse(club.settings);
      }
      
      return club;
    } catch (error) {
      console.error("Error getting club:", error);
      throw error;
    }
  }

  // List all clubs with filters
  async listClubs(filters = {}) {
    try {
      const queries = [
        Query.orderDesc("memberCount"),
        Query.limit(filters.limit || 20)
      ];
      
      if (filters.country) {
        queries.push(Query.equal("country", filters.country));
      }
      
      if (filters.city) {
        queries.push(Query.equal("city", filters.city));
      }
      
      if (filters.isPublic !== undefined) {
        queries.push(Query.equal("isPublic", filters.isPublic));
      }
      
      if (filters.search) {
        queries.push(Query.search("name", filters.search));
      }
      
      if (filters.offset) {
        queries.push(Query.offset(filters.offset));
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        CLUBS_COLLECTION,
        queries
      );
      
      // Parse JSON fields for each club
      response.documents = response.documents.map(club => {
        if (club.clubStats) {
          club.clubStats = JSON.parse(club.clubStats);
        }
        if (club.settings) {
          club.settings = JSON.parse(club.settings);
        }
        return club;
      });
      
      return response;
    } catch (error) {
      console.error("Error listing clubs:", error);
      throw error;
    }
  }

  // Get user's clubs
  async getUserClubs(userId) {
    try {
      // Get all teams the user is a member of
      const userTeams = await teams.list();
      
      if (!userTeams.teams || userTeams.teams.length === 0) {
        return { documents: [], total: 0 };
      }
      
      // Get club documents for these teams
      const teamIds = userTeams.teams.map(team => team.$id);
      const response = await databases.listDocuments(
        DATABASE_ID,
        CLUBS_COLLECTION,
        [Query.equal("teamId", teamIds)]
      );
      
      // Parse JSON fields and add user's role
      response.documents = response.documents.map(club => {
        if (club.clubStats) {
          club.clubStats = JSON.parse(club.clubStats);
        }
        if (club.settings) {
          club.settings = JSON.parse(club.settings);
        }
        
        // Find user's role in the team
        const team = userTeams.teams.find(t => t.$id === club.teamId);
        club.userRole = this.getUserRoleInTeam(team, userId);
        
        return club;
      });
      
      return response;
    } catch (error) {
      console.error("Error getting user clubs:", error);
      throw error;
    }
  }

  // Join an open club
  async joinClub(clubId, userId, userEmail) {
    try {
      const club = await this.getClub(clubId);
      
      if (club.joinMethod === "invite") {
        throw new Error("This club requires an invitation to join");
      }
      
      if (club.joinMethod === "request") {
        // TODO: Implement join request system
        throw new Error("Join requests are not yet implemented");
      }
      
      // For open clubs, directly add the member
      const membership = await teams.createMembership(
        club.teamId,
        [],  // Empty roles array for regular members
        userEmail || undefined,
        userId || undefined
      );
      
      // Update member count
      await databases.updateDocument(
        DATABASE_ID,
        CLUBS_COLLECTION,
        clubId,
        {
          memberCount: club.memberCount + 1
        }
      );
      
      // Add activity
      await this.addClubActivity(clubId, club.teamId, "member_joined", userId, {
        message: "joined the club"
      });
      
      return membership;
    } catch (error) {
      console.error("Error joining club:", error);
      throw error;
    }
  }

  // Invite member to club
  async inviteMember(clubId, email, roles = []) {
    try {
      const club = await this.getClub(clubId);
      
      const membership = await teams.createMembership(
        club.teamId,
        roles,
        email,
        undefined,
        undefined,
        `${window.location.origin}/clubs/${clubId}/join`
      );
      
      return membership;
    } catch (error) {
      console.error("Error inviting member:", error);
      throw error;
    }
  }

  // Leave club
  async leaveClub(clubId, membershipId) {
    try {
      const club = await this.getClub(clubId);
      
      await teams.deleteMembership(club.teamId, membershipId);
      
      // Update member count
      await databases.updateDocument(
        DATABASE_ID,
        CLUBS_COLLECTION,
        clubId,
        {
          memberCount: Math.max(0, club.memberCount - 1)
        }
      );
      
      return true;
    } catch (error) {
      console.error("Error leaving club:", error);
      throw error;
    }
  }

  // Update club details
  async updateClub(clubId, updates) {
    try {
      // Handle JSON fields
      if (updates.clubStats && typeof updates.clubStats === 'object') {
        updates.clubStats = JSON.stringify(updates.clubStats);
      }
      if (updates.settings && typeof updates.settings === 'object') {
        updates.settings = JSON.stringify(updates.settings);
      }
      
      const club = await databases.updateDocument(
        DATABASE_ID,
        CLUBS_COLLECTION,
        clubId,
        updates
      );
      
      return club;
    } catch (error) {
      console.error("Error updating club:", error);
      throw error;
    }
  }

  // Delete club
  async deleteClub(clubId) {
    try {
      const club = await this.getClub(clubId);
      
      // Delete the team (this will remove all members)
      await teams.delete(club.teamId);
      
      // Delete the club document
      await databases.deleteDocument(
        DATABASE_ID,
        CLUBS_COLLECTION,
        clubId
      );
      
      return true;
    } catch (error) {
      console.error("Error deleting club:", error);
      throw error;
    }
  }

  // Upload club logo
  async uploadClubLogo(clubId, file) {
    try {
      const uploadedFile = await storage.createFile(
        CLUB_LOGOS_BUCKET,
        ID.unique(),
        file
      );
      
      const logoUrl = storage.getFileView(
        CLUB_LOGOS_BUCKET,
        uploadedFile.$id
      );
      
      await this.updateClub(clubId, { logoUrl });
      
      return logoUrl;
    } catch (error) {
      console.error("Error uploading club logo:", error);
      throw error;
    }
  }

  // Get club members
  async getClubMembers(clubId) {
    try {
      const club = await this.getClub(clubId);
      const memberships = await teams.listMemberships(club.teamId);
      
      return memberships;
    } catch (error) {
      console.error("Error getting club members:", error);
      throw error;
    }
  }

  // Update member role (captain/moderator)
  async updateMemberRole(clubId, userId, role, action = 'add') {
    try {
      const club = await this.getClub(clubId);
      const settings = club.settings || {};
      
      if (role === 'captain') {
        if (action === 'add' && !settings.captains?.includes(userId)) {
          settings.captains = [...(settings.captains || []), userId];
        } else if (action === 'remove') {
          settings.captains = (settings.captains || []).filter(id => id !== userId);
        }
      } else if (role === 'moderator') {
        if (action === 'add' && !settings.moderators?.includes(userId)) {
          settings.moderators = [...(settings.moderators || []), userId];
        } else if (action === 'remove') {
          settings.moderators = (settings.moderators || []).filter(id => id !== userId);
        }
      }
      
      await this.updateClub(clubId, { settings });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating member role:", error);
      throw error;
    }
  }
  
  // Check if user is captain or moderator
  async getUserClubRole(clubId, userId) {
    try {
      const club = await this.getClub(clubId);
      const settings = club.settings || {};
      
      if (club.createdBy === userId) {
        return 'owner';
      }
      if (settings.captains?.includes(userId)) {
        return 'captain';
      }
      if (settings.moderators?.includes(userId)) {
        return 'moderator';
      }
      return 'member';
    } catch (error) {
      console.error("Error getting user club role:", error);
      return 'member';
    }
  }

  // Add club activity
  async addClubActivity(clubId, teamId, type, userId, data) {
    try {
      const activity = await databases.createDocument(
        DATABASE_ID,
        CLUB_ACTIVITIES_COLLECTION,
        ID.unique(),
        {
          clubId,
          type,
          userId,
          data: JSON.stringify(data),
          createdAt: new Date().toISOString()
        },
        [
          Permission.read(Role.any()),  // Anyone can read activities
          Permission.update(Role.user(userId)),  // User can update their own activity
          Permission.delete(Role.user(userId))  // User can delete their own activity
        ]
      );
      
      return activity;
    } catch (error) {
      console.error("Error adding club activity:", error);
      // Non-critical error, don't throw
      return null;
    }
  }

  // Get club activities
  async getClubActivities(clubId, limit = 20) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CLUB_ACTIVITIES_COLLECTION,
        [
          Query.equal("clubId", clubId),
          Query.orderDesc("createdAt"),
          Query.limit(limit)
        ]
      );
      
      // Parse JSON data field
      response.documents = response.documents.map(activity => {
        if (activity.data) {
          activity.data = JSON.parse(activity.data);
        }
        return activity;
      });
      
      return response;
    } catch (error) {
      console.error("Error getting club activities:", error);
      return { documents: [], total: 0 };
    }
  }

  // Create club announcement
  async createAnnouncement(clubId, title, content, authorId) {
    try {
      const club = await this.getClub(clubId);
      
      const announcement = await databases.createDocument(
        DATABASE_ID,
        CLUB_ANNOUNCEMENTS_COLLECTION,
        ID.unique(),
        {
          clubId,
          title,
          content,
          priority: "normal",
          createdBy: authorId,
          createdAt: new Date().toISOString()
        },
        [
          Permission.read(Role.any()),  // Anyone can read announcements
          Permission.update(Role.user(authorId)),  // Author can update
          Permission.update(Role.team(club.teamId, "owner")),  // Owner can update
          Permission.delete(Role.team(club.teamId, "owner"))  // Only owner can delete
        ]
      );
      
      // Add activity
      await this.addClubActivity(clubId, club.teamId, "announcement_created", authorId, {
        title,
        announcementId: announcement.$id
      });
      
      return announcement;
    } catch (error) {
      console.error("Error creating announcement:", error);
      throw error;
    }
  }

  // Get club announcements
  async getClubAnnouncements(clubId, limit = 10) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CLUB_ANNOUNCEMENTS_COLLECTION,
        [
          Query.equal("clubId", clubId),
          Query.orderDesc("isPinned"),
          Query.orderDesc("createdAt"),
          Query.limit(limit)
        ]
      );
      
      return response;
    } catch (error) {
      console.error("Error getting club announcements:", error);
      return { documents: [], total: 0 };
    }
  }

  // Create club tournament
  async createClubTournament(clubId, tournamentData) {
    try {
      const club = await this.getClub(clubId);
      
      const tournament = await databases.createDocument(
        DATABASE_ID,
        CLUB_TOURNAMENTS_COLLECTION,
        ID.unique(),
        {
          clubId,
          teamId: club.teamId,
          name: tournamentData.name,
          description: tournamentData.description || "",
          format: tournamentData.format || "knockout",
          startDate: tournamentData.startDate,
          endDate: tournamentData.endDate,
          maxParticipants: tournamentData.maxParticipants || 32,
          participants: JSON.stringify([]),
          brackets: JSON.stringify({}),
          status: "upcoming",
          createdBy: tournamentData.createdBy,
          createdAt: new Date().toISOString()
        },
        [
          Permission.read(Role.any()),  // Anyone can view tournaments
          Permission.update(Role.team(club.teamId, "owner")),  // Owner can update
          Permission.delete(Role.team(club.teamId, "owner"))  // Owner can delete
        ]
      );
      
      // Add activity
      await this.addClubActivity(clubId, club.teamId, "tournament_created", tournamentData.createdBy, {
        tournamentName: tournamentData.name,
        tournamentId: tournament.$id,
        startDate: tournamentData.startDate
      });
      
      return tournament;
    } catch (error) {
      console.error("Error creating club tournament:", error);
      throw error;
    }
  }

  // Get club tournaments
  async getClubTournaments(clubId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CLUB_TOURNAMENTS_COLLECTION,
        [
          Query.equal("clubId", clubId),
          Query.orderDesc("startDate")
        ]
      );
      
      // Parse JSON fields
      response.documents = response.documents.map(tournament => {
        if (tournament.participants) {
          tournament.participants = JSON.parse(tournament.participants);
        }
        if (tournament.brackets) {
          tournament.brackets = JSON.parse(tournament.brackets);
        }
        return tournament;
      });
      
      return response;
    } catch (error) {
      console.error("Error getting club tournaments:", error);
      return { documents: [], total: 0 };
    }
  }

  // Helper: Get user's role in a team
  getUserRoleInTeam(team, userId) {
    if (!team || !team.$id) return null;
    
    // Check if user is the owner
    if (team.$createdBy === userId) {
      return "owner";
    }
    
    // TODO: Check membership roles when we have access to memberships
    return "member";
  }

  // Accept club invitation
  async acceptInvitation(teamId, membershipId, userId, secret) {
    try {
      const membership = await teams.updateMembershipStatus(
        teamId,
        membershipId,
        userId,
        secret
      );
      
      // Find the club for this team
      const clubResponse = await databases.listDocuments(
        DATABASE_ID,
        CLUBS_COLLECTION,
        [Query.equal("teamId", teamId)]
      );
      
      if (clubResponse.documents.length > 0) {
        const club = clubResponse.documents[0];
        
        // Update member count
        await databases.updateDocument(
          DATABASE_ID,
          CLUBS_COLLECTION,
          club.$id,
          {
            memberCount: club.memberCount + 1
          }
        );
        
        // Add activity
        await this.addClubActivity(club.$id, teamId, "member_joined", userId, {
          message: "joined the club via invitation"
        });
      }
      
      return membership;
    } catch (error) {
      console.error("Error accepting invitation:", error);
      throw error;
    }
  }
}

export default new ClubTeamsService();