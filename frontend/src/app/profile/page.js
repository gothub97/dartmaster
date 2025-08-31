"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useStats } from "@/hooks/useStats";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { 
    profile, 
    loading: profileLoading, 
    createProfile, 
    updateProfile, 
    uploadAvatar,
    checkUsernameAvailability
  } = useUserProfile();
  const { stats, loading: statsLoading } = useStats();
  
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
  const [objectives, setObjectives] = useState({
    weeklyGamesGoal: 15,
    accuracyTarget: 60,
    doublesTarget: 40,
    practiceHoursGoal: 5
  });
  const [editingObjectives, setEditingObjectives] = useState(false);
  const [error, setError] = useState("");

  // Check if user needs to create profile
  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (user && !profile) {
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

  // Load objectives from profile
  useEffect(() => {
    if (profile?.objectives) {
      try {
        const parsed = JSON.parse(profile.objectives);
        setObjectives({
          weeklyGamesGoal: parsed.weeklyGamesGoal ?? 15,
          accuracyTarget: parsed.accuracyTarget ?? 60,
          doublesTarget: parsed.doublesTarget ?? 40,
          practiceHoursGoal: parsed.practiceHoursGoal ?? 5
        });
      } catch (e) {
        console.error('Error parsing objectives:', e);
      }
    }
  }, [profile]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
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
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }
      
      setAvatarFile(file);
      
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
        result = await createProfile(formData);
      } else {
        result = await updateProfile(formData);
      }

      if (!result.success) {
        setError(result.error || "Failed to save profile");
        setSaving(false);
        return;
      }

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

  const handleSaveObjectives = async () => {
    try {
      const result = await updateProfile({
        objectives: JSON.stringify(objectives)
      });
      if (result.success) {
        setEditingObjectives(false);
      }
    } catch (error) {
      console.error('Error saving objectives:', error);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="font-semibold text-gray-900 text-lg">Dartmaster</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/play" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                Play
              </Link>
              <Link href="/practice" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                Training
              </Link>
              <Link href="/activities" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                Activities
              </Link>
              <Link href="/friends" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                Friends
              </Link>
              <Link href="/profile" className="text-sm font-medium text-gray-900 border-b-2 border-orange-500 pb-1">
                Profile
              </Link>
            </nav>

            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500"></div>
          
          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex items-end -mt-16 mb-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 bg-white rounded-full border-4 border-white overflow-hidden shadow-lg">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-orange-100">
                      <span className="text-orange-600 text-4xl font-bold">
                        {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                </div>
                
                {isEditing && (
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition shadow-lg">
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
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile?.username ? `@${profile.username}` : user.name || "Player"}
                </h1>
                <p className="text-gray-500">{user.email}</p>
                {profile?.country && (
                  <p className="text-gray-500 mt-1">📍 {profile.country}</p>
                )}
              </div>
              
              {!isEditing && profile && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* Form or Display */}
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Choose a unique username"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                      {checkingUsername && (
                        <div className="absolute right-3 top-2.5 text-gray-400 text-sm">
                          Checking...
                        </div>
                      )}
                      {!checkingUsername && usernameAvailable === true && formData.username && (
                        <div className="absolute right-3 top-2.5 text-green-500 text-sm">
                          ✓ Available
                        </div>
                      )}
                      {!checkingUsername && usernameAvailable === false && (
                        <div className="absolute right-3 top-2.5 text-red-500 text-sm">
                          ✗ Taken
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select a country</option>
                      {countries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>

                  {/* Club */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Club
                    </label>
                    <input
                      type="text"
                      name="club"
                      value={formData.club}
                      onChange={handleInputChange}
                      placeholder="Your dart club"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="public">Public - Anyone can view</option>
                      <option value="friends">Friends Only</option>
                      <option value="private">Private - Only you</option>
                    </select>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  {!isNewProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setError("");
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
                      className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
                    >
                      Cancel
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    disabled={saving || checkingUsername || usernameAvailable === false}
                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : isNewProfile ? "Create Profile" : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {profile?.bio && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">About</h3>
                    <p className="text-gray-700">{profile.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {profile?.club && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Club</h3>
                      <p className="text-gray-700">{profile.club}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Member Since</h3>
                    <p className="text-gray-700">
                      {new Date(user.$createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Profile Status</h3>
                    <p className="text-gray-700 capitalize">{profile?.visibility || "Public"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats and Objectives */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Game Statistics</h2>
              
              {statsLoading ? (
                <div className="text-center text-gray-400 py-8">Loading statistics...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{stats.gamesPlayed}</div>
                    <div className="text-sm text-gray-500 mt-1">Games Played</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.gamesWon}</div>
                    <div className="text-sm text-gray-500 mt-1">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats.winRate}%</div>
                    <div className="text-sm text-gray-500 mt-1">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{stats.averageScore}</div>
                    <div className="text-sm text-gray-500 mt-1">Avg Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{stats.total180s}</div>
                    <div className="text-sm text-gray-500 mt-1">180s</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{stats.highestCheckout}</div>
                    <div className="text-sm text-gray-500 mt-1">Best Checkout</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{stats.accuracy}%</div>
                    <div className="text-sm text-gray-500 mt-1">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600">{stats.bullseyeCount}</div>
                    <div className="text-sm text-gray-500 mt-1">Bullseyes</div>
                  </div>
                </div>
              )}
            </div>

            {/* Objectives Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Objectives</h2>
                {!editingObjectives ? (
                  <button
                    onClick={() => setEditingObjectives(true)}
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    Edit Goals
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingObjectives(false);
                        if (profile?.objectives) {
                          setObjectives(JSON.parse(profile.objectives));
                        }
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveObjectives}
                      className="text-sm text-orange-600 hover:text-orange-700"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Weekly Games Goal
                  </label>
                  {editingObjectives ? (
                    <input
                      type="number"
                      value={objectives.weeklyGamesGoal}
                      onChange={(e) => setObjectives({...objectives, weeklyGamesGoal: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">{objectives.weeklyGamesGoal} games</div>
                  )}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                      <span>Current: {stats.weeklyGames || 0}/{objectives.weeklyGamesGoal}</span>
                      <span>{Math.round((stats.weeklyGames || 0) / objectives.weeklyGamesGoal * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (stats.weeklyGames || 0) / objectives.weeklyGamesGoal * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Accuracy Target
                  </label>
                  {editingObjectives ? (
                    <input
                      type="number"
                      value={objectives.accuracyTarget}
                      onChange={(e) => setObjectives({...objectives, accuracyTarget: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">{objectives.accuracyTarget}%</div>
                  )}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                      <span>Current: {stats.accuracy || 0}%</span>
                      <span>{stats.accuracy >= objectives.accuracyTarget ? '✓' : ''}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${stats.accuracy >= objectives.accuracyTarget ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(100, (stats.accuracy || 0) / objectives.accuracyTarget * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Doubles Hit Rate Target
                  </label>
                  {editingObjectives ? (
                    <input
                      type="number"
                      value={objectives.doublesTarget}
                      onChange={(e) => setObjectives({...objectives, doublesTarget: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">{objectives.doublesTarget}%</div>
                  )}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                      <span>Current: {stats.doublesHit || 0}%</span>
                      <span>{stats.doublesHit >= objectives.doublesTarget ? '✓' : ''}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${stats.doublesHit >= objectives.doublesTarget ? 'bg-green-500' : 'bg-purple-500'}`}
                        style={{ width: `${Math.min(100, (stats.doublesHit || 0) / objectives.doublesTarget * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Practice Hours Goal (Weekly)
                  </label>
                  {editingObjectives ? (
                    <input
                      type="number"
                      value={objectives.practiceHoursGoal}
                      onChange={(e) => setObjectives({...objectives, practiceHoursGoal: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">{objectives.practiceHoursGoal} hours</div>
                  )}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                      <span>This week: 0h</span>
                      <span>0%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Achievements and Public Link */}
          <div className="space-y-8">
            {/* Recent Achievements */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Achievements</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <p className="font-medium text-gray-900">Sharpshooter</p>
                    <p className="text-sm text-gray-500">Hit 10 bullseyes</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🔥</div>
                  <div>
                    <p className="font-medium text-gray-900">On Fire</p>
                    <p className="text-sm text-gray-500">3 game win streak</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">💯</div>
                  <div>
                    <p className="font-medium text-gray-900">Century</p>
                    <p className="text-sm text-gray-500">Score 100+ in one turn</p>
                  </div>
                </div>
              </div>
              <Link 
                href="/achievements"
                className="block text-center text-sm text-orange-600 hover:text-orange-700 mt-4 pt-4 border-t border-gray-100"
              >
                View all achievements →
              </Link>
            </div>

            {/* Public Profile Link */}
            {profile?.username && profile?.visibility === "public" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Share Your Profile</h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 break-all">
                    dartmaster.app/players/{profile.username}
                  </p>
                </div>
                <button className="w-full mt-3 px-4 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition text-sm font-medium">
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}