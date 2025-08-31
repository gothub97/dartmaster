"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useGame } from "@/contexts/GameContextV2";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { 
    profile, 
    loading: profileLoading, 
    createProfile, 
    updateProfile, 
    uploadAvatar,
    checkUsernameAvailability,
    calculateUserStats 
  } = useUserProfile();
  const { activeMatches } = useGame();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    country: "",
    club: "",
    visibility: "public",
    socialLinks: {
      twitter: "",
      instagram: "",
      facebook: ""
    }
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState("");

  // Check if user needs to create profile
  useEffect(() => {
    console.log("Profile check - authLoading:", authLoading, "profileLoading:", profileLoading, "user:", user?.$id, "profile:", profile?.$id);
    
    if (!authLoading && !profileLoading) {
      if (user && !profile) {
        console.log("Setting up new profile for user");
        setIsNewProfile(true);
        setIsEditing(true);
      } else if (profile) {
        setFormData({
          username: profile.username || "",
          bio: profile.bio || "",
          country: profile.country || "",
          club: profile.club || "",
          visibility: profile.visibility || "public",
          socialLinks: profile.socialLinks || {
            twitter: "",
            instagram: "",
            facebook: ""
          }
        });
        setAvatarPreview(profile.avatarUrl);
      }
    }
  }, [user, profile, authLoading, profileLoading]);

  // Load user statistics
  useEffect(() => {
    const loadStats = async () => {
      if (user) {
        setLoadingStats(true);
        const userStats = await calculateUserStats(user.$id);
        setStats(userStats);
        setLoadingStats(false);
      }
    };
    loadStats();
  }, [user, calculateUserStats]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  // Check username availability with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.username && formData.username.length >= 3) {
        if (profile && formData.username === profile.username) {
          setUsernameAvailable(true);
          return;
        }
        
        setCheckingUsername(true);
        const available = await checkUsernameAvailability(formData.username);
        setUsernameAvailable(available);
        setCheckingUsername(false);
      } else {
        setUsernameAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, checkUsernameAvailability, profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith("social_")) {
      const socialKey = name.replace("social_", "");
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // Validate username
      if (!formData.username || formData.username.length < 3) {
        setError("Username must be at least 3 characters");
        setSaving(false);
        return;
      }

      if (usernameAvailable === false) {
        setError("Username is already taken");
        setSaving(false);
        return;
      }

      let result;
      
      if (isNewProfile) {
        // Create new profile
        result = await createProfile(formData);
      } else {
        // Update existing profile
        result = await updateProfile(formData);
      }

      if (!result.success) {
        setError(result.error || "Failed to save profile");
        setSaving(false);
        return;
      }

      // Upload avatar if changed
      if (avatarFile) {
        const avatarResult = await uploadAvatar(avatarFile);
        if (!avatarResult.success) {
          setError("Profile saved but avatar upload failed");
        }
      }

      setIsEditing(false);
      setIsNewProfile(false);
      setAvatarFile(null);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const countries = [
    "United States", "United Kingdom", "Canada", "Australia", "Germany",
    "Netherlands", "Belgium", "Ireland", "New Zealand", "South Africa",
    "France", "Spain", "Italy", "Sweden", "Norway", "Denmark"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                </div>
                <span className="font-bold text-xl text-white">Dartmaster</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="px-4 py-2 text-gray-300 hover:text-white transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Header */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden mb-8">
          {/* Background Banner */}
          <div className="h-48 bg-gradient-to-r from-red-600/20 to-purple-600/20"></div>
          
          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex items-end -mt-16 mb-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 bg-black/60 rounded-2xl border-4 border-black/40 overflow-hidden">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-purple-600">
                      <span className="text-white text-4xl font-bold">
                        {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                </div>
                
                {isEditing && (
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-700 transition">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              <div className="ml-6 flex-1">
                <h1 className="text-3xl font-bold text-white">
                  {profile?.username ? `@${profile.username}` : user.name || "Player"}
                </h1>
                <p className="text-gray-400">{user.email}</p>
                {profile?.country && (
                  <p className="text-gray-400 mt-1">📍 {profile.country}</p>
                )}
              </div>
              
              {!isEditing && profile && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* Form or Display */}
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
                    {error}
                  </div>
                )}

                {/* Username Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Choose a unique username"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                      required
                    />
                    {checkingUsername && (
                      <div className="absolute right-3 top-3.5 text-gray-400">
                        Checking...
                      </div>
                    )}
                    {!checkingUsername && usernameAvailable === true && formData.username && (
                      <div className="absolute right-3 top-3.5 text-green-400">
                        ✓ Available
                      </div>
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <div className="absolute right-3 top-3.5 text-red-400">
                        ✗ Taken
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                  />
                </div>

                {/* Country and Club */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Country
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500 transition"
                    >
                      <option value="">Select a country</option>
                      {countries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Club
                    </label>
                    <input
                      type="text"
                      name="club"
                      value={formData.club}
                      onChange={handleInputChange}
                      placeholder="Your dart club"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                    />
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Profile Visibility
                  </label>
                  <select
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500 transition"
                  >
                    <option value="public">Public - Anyone can view</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private - Only you</option>
                  </select>
                </div>

                {/* Social Links */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Social Links
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="social_twitter"
                      value={formData.socialLinks.twitter}
                      onChange={handleInputChange}
                      placeholder="Twitter username"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                    />
                    <input
                      type="text"
                      name="social_instagram"
                      value={formData.socialLinks.instagram}
                      onChange={handleInputChange}
                      placeholder="Instagram username"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                    />
                    <input
                      type="text"
                      name="social_facebook"
                      value={formData.socialLinks.facebook}
                      onChange={handleInputChange}
                      placeholder="Facebook username"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  {!isNewProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setError("");
                        // Reset form
                        setFormData({
                          username: profile.username || "",
                          bio: profile.bio || "",
                          country: profile.country || "",
                          club: profile.club || "",
                          visibility: profile.visibility || "public",
                          socialLinks: profile.socialLinks || {
                            twitter: "",
                            instagram: "",
                            facebook: ""
                          }
                        });
                        setAvatarPreview(profile.avatarUrl);
                        setAvatarFile(null);
                      }}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                    >
                      Cancel
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    disabled={saving || checkingUsername || usernameAvailable === false}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : isNewProfile ? "Create Profile" : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Bio */}
                {profile?.bio && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">About</h3>
                    <p className="text-white">{profile.bio}</p>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {profile?.club && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Club</h3>
                      <p className="text-white">{profile.club}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Member Since</h3>
                    <p className="text-white">
                      {new Date(user.$createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Profile Status</h3>
                    <p className="text-white capitalize">{profile?.visibility || "Public"}</p>
                  </div>
                </div>

                {/* Social Links */}
                {profile?.socialLinks && Object.keys(profile.socialLinks).some(key => profile.socialLinks[key]) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Social</h3>
                    <div className="flex space-x-4">
                      {profile.socialLinks.twitter && (
                        <a
                          href={`https://twitter.com/${profile.socialLinks.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition"
                        >
                          Twitter
                        </a>
                      )}
                      {profile.socialLinks.instagram && (
                        <a
                          href={`https://instagram.com/${profile.socialLinks.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-400 hover:text-pink-300 transition"
                        >
                          Instagram
                        </a>
                      )}
                      {profile.socialLinks.facebook && (
                        <a
                          href={`https://facebook.com/${profile.socialLinks.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-400 transition"
                        >
                          Facebook
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Game Statistics</h2>
          
          {loadingStats ? (
            <div className="text-center text-gray-400">Loading statistics...</div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500">{stats.gamesPlayed}</div>
                <div className="text-sm text-gray-400 mt-1">Games Played</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">{stats.wins}</div>
                <div className="text-sm text-gray-400 mt-1">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500">{stats.winRate}%</div>
                <div className="text-sm text-gray-400 mt-1">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500">{stats.averageScore}</div>
                <div className="text-sm text-gray-400 mt-1">Avg Score</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p>No statistics available yet</p>
              <Link 
                href="/play"
                className="inline-flex items-center mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                Play Your First Game
              </Link>
            </div>
          )}
        </div>

        {/* Public Profile Link */}
        {profile?.username && profile?.visibility === "public" && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 mb-2">Share your profile</p>
            <Link
              href={`/players/${profile.username}`}
              className="text-red-400 hover:text-red-300 transition"
            >
              dartmaster.app/players/{profile.username}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}