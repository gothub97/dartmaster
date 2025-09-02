"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useClub } from "@/contexts/ClubContext";
import SharedNavigation from "@/components/layout/SharedNavigation";

export default function CreateClubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createClub } = useClub();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    country: "",
    city: "",
    isPublic: true,
    joinMethod: "open", // open, request, invite
    maxMembers: 100,
    minLevel: 0,
    logoFile: null,
    logoPreview: null
  });

  const countries = [
    "USA", "UK", "Germany", "Netherlands", "Australia", 
    "Canada", "Ireland", "Belgium", "Austria", "France",
    "Spain", "Italy", "Sweden", "Norway", "Denmark"
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Logo file must be less than 2MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          logoFile: file,
          logoPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        if (!formData.name.trim()) {
          setError("Club name is required");
          return false;
        }
        if (formData.name.length < 3 || formData.name.length > 50) {
          setError("Club name must be between 3 and 50 characters");
          return false;
        }
        break;
      case 2:
        if (formData.description && formData.description.length > 500) {
          setError("Description must be less than 500 characters");
          return false;
        }
        break;
      case 3:
        // Optional location info
        break;
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (!validateStep(3)) return;

    try {
      setLoading(true);
      setError("");
      
      const clubData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        country: formData.country,
        city: formData.city,
        isPublic: formData.isPublic,
        joinMethod: formData.joinMethod,
        settings: {
          maxMembers: parseInt(formData.maxMembers),
          minLevel: parseInt(formData.minLevel),
          allowGuestPlay: false,
          tournamentFrequency: "weekly"
        }
      };

      const result = await createClub(clubData);
      
      // TODO: Upload logo if provided
      // if (formData.logoFile) {
      //   await uploadClubLogo(result.club.$id, formData.logoFile);
      // }
      
      router.push(`/clubs/${result.club.$id}`);
    } catch (error) {
      console.error("Error creating club:", error);
      setError(error.message || "Failed to create club. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavigation />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/clubs"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clubs
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Your Dart Club</h1>
          <p className="text-gray-600">
            Start your own dart club and invite players to join. You'll be the club owner with full control.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= num
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {num}
              </div>
              {num < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > num ? "bg-orange-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Club Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., London Arrows"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  maxLength={50}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.name.length}/50 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell players what your club is about..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Club Logo (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  {formData.logoPreview ? (
                    <img
                      src={formData.logoPreview}
                      alt="Club logo preview"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                    >
                      Choose File
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPG up to 2MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Settings */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Club Settings</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Club Visibility
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isPublic"
                      value="true"
                      checked={formData.isPublic === true}
                      onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                      className="mr-2"
                    />
                    <div>
                      <div className="font-medium">Public</div>
                      <div className="text-sm text-gray-500">Anyone can find and view your club</div>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isPublic"
                      value="false"
                      checked={formData.isPublic === false}
                      onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                      className="mr-2"
                    />
                    <div>
                      <div className="font-medium">Private</div>
                      <div className="text-sm text-gray-500">Only members can view club details</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Join Method
                </label>
                <select
                  name="joinMethod"
                  value={formData.joinMethod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="open">Open - Anyone can join instantly</option>
                  <option value="request">Request - Requires approval to join</option>
                  <option value="invite">Invite Only - Members must be invited</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Members
                  </label>
                  <input
                    type="number"
                    name="maxMembers"
                    value={formData.maxMembers}
                    onChange={handleInputChange}
                    min="2"
                    max="500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Level
                  </label>
                  <input
                    type="number"
                    name="minLevel"
                    value={formData.minLevel}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Location (Optional)</h2>
              <p className="text-gray-600 mb-4">
                Help local players find your club by adding location information.
              </p>
              
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g., London"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Club Preview</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {formData.name || "Not set"}</div>
                  <div><span className="font-medium">Type:</span> {formData.isPublic ? "Public" : "Private"}</div>
                  <div><span className="font-medium">Join Method:</span> {formData.joinMethod}</div>
                  <div><span className="font-medium">Location:</span> {[formData.city, formData.country].filter(Boolean).join(", ") || "Not set"}</div>
                  <div><span className="font-medium">Max Members:</span> {formData.maxMembers}</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Previous
              </button>
            ) : (
              <div></div>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Club"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}