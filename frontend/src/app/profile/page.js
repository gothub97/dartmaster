"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import { validateForm } from "@/utils/validation";

const AvatarUpload = ({ currentAvatar, onAvatarChange }) => {
  const [preview, setPreview] = useState(currentAvatar || "");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        onAvatarChange(file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-lg">
          {preview ? (
            <img
              src={preview}
              alt="Profile avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          )}
        </div>
        <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Click to upload avatar<br />
        Max 5MB, JPG/PNG only
      </p>
    </div>
  );
};

const ProfileStats = ({ user }) => {
  const stats = [
    { label: "Games Played", value: user?.prefs?.stats?.gamesPlayed || 0 },
    { label: "Wins", value: user?.prefs?.stats?.wins || 0 },
    { label: "Average Score", value: user?.prefs?.stats?.averageScore || 0 },
    { label: "Best Finish", value: user?.prefs?.stats?.bestFinish || "-" }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stat.value}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    country: "",
    club: "",
    avatar: null
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.prefs?.bio || "",
        country: user.prefs?.country || "",
        club: user.prefs?.club || "",
        avatar: null
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleAvatarChange = (file) => {
    setFormData(prev => ({
      ...prev,
      avatar: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    
    // Validation rules
    const rules = {
      name: { required: true, type: "name", label: "Name" },
      bio: {
        validator: (value) => {
          if (value && value.length > 500) {
            return { isValid: false, error: "Bio must be less than 500 characters" };
          }
          return { isValid: true };
        }
      }
    };

    const validation = validateForm(formData, rules);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    
    try {
      // Prepare preferences object
      const prefs = {
        ...user.prefs,
        bio: formData.bio,
        country: formData.country,
        club: formData.club
      };

      // TODO: Handle avatar upload to Appwrite Storage
      // For now, we'll skip avatar upload implementation
      if (formData.avatar) {
        console.log("Avatar upload will be implemented with Appwrite Storage");
      }

      const result = await updateProfile(formData.name, prefs);
      
      if (result.success) {
        setAlert({
          type: "success",
          message: "Profile updated successfully!"
        });
      } else {
        setAlert({
          type: "error",
          message: result.error || "Failed to update profile. Please try again."
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setAlert({
        type: "error",
        message: "An unexpected error occurred. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const countries = [
    "United States", "United Kingdom", "Canada", "Australia", "Germany", 
    "Netherlands", "Belgium", "Ireland", "New Zealand", "South Africa",
    // Add more countries as needed
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Profile Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your account settings and dartboard preferences
            </p>
          </div>

          {alert && (
            <Alert 
              variant={alert.type} 
              className="mb-6"
              onClose={() => setAlert(null)}
            >
              {alert.message}
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Form */}
            <div className="lg:col-span-2">
              <Card>
                <Card.Header>
                  <Card.Title>Personal Information</Card.Title>
                  <Card.Description>
                    Update your profile information and preferences
                  </Card.Description>
                </Card.Header>
                
                <Card.Content>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
                      <div className="flex-shrink-0">
                        <AvatarUpload
                          currentAvatar={user?.prefs?.avatarUrl}
                          onAvatarChange={handleAvatarChange}
                        />
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <Input
                          label="Full Name"
                          name="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={handleChange}
                          error={errors.name}
                          required
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Bio
                          </label>
                          <textarea
                            name="bio"
                            rows={3}
                            placeholder="Tell us about yourself..."
                            value={formData.bio}
                            onChange={handleChange}
                            className="block w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                          />
                          {errors.bio && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                              {errors.bio}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {formData.bio.length}/500 characters
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Country
                        </label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          className="block w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                        >
                          <option value="">Select a country</option>
                          {countries.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Input
                        label="Club Affiliation"
                        name="club"
                        type="text"
                        placeholder="Your dart club (optional)"
                        value={formData.club}
                        onChange={handleChange}
                        error={errors.club}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Card.Content>
              </Card>
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-6">
              <Card>
                <Card.Header>
                  <Card.Title>Account Info</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Email:</span>
                      <div className="font-medium">{user?.email}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Member since:</span>
                      <div className="font-medium">
                        {user?.$createdAt ? new Date(user.$createdAt).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Email verified:</span>
                      <div className="flex items-center">
                        {user?.emailVerification ? (
                          <span className="text-green-600 dark:text-green-400">✓ Verified</span>
                        ) : (
                          <span className="text-yellow-600 dark:text-yellow-400">⚠ Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <Card.Title>Game Statistics</Card.Title>
                  <Card.Description>Your dart game performance</Card.Description>
                </Card.Header>
                <Card.Content>
                  <ProfileStats user={user} />
                </Card.Content>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;