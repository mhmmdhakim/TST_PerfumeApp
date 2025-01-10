// src/components/preferences/PreferencesForm.jsx
import React, { useState, useEffect } from "react";
import { apiClient } from "../../lib/axios";

const PreferencesForm = ({ onSubmit }) => {
  const [preferences, setPreferences] = useState({
    favorite_notes: [],
    preferred_categories: [],
    price_range: "",
    preferred_brands: [], // Optional, can be empty
    seasonal_preference: "",
    scent_strength: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasPreferences, setHasPreferences] = useState(false); // Track if preferences exist

  // Fetch existing preferences when component mounts
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await apiClient.get("/api/preferences/me");
        if (response.data) {
          setPreferences({
            ...response.data,
            // Ensure arrays are initialized even if null from API
            favorite_notes: response.data.favorite_notes || [],
            preferred_categories: response.data.preferred_categories || [],
            preferred_brands: response.data.preferred_brands || [],
          });
          setHasPreferences(true); // Set flag if preferences exist
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setHasPreferences(false); // No preferences exist yet
        } else {
          setError("Error loading preferences");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formattedPreferences = {
        ...preferences,
        // Ensure all required fields are arrays
        favorite_notes: preferences.favorite_notes,
        preferred_categories: preferences.preferred_categories,
        preferred_brands: preferences.preferred_brands || [], // Optional field
        seasonal_preference: preferences.seasonal_preference || null, // Optional field
        scent_strength: preferences.scent_strength || null, // Optional field
      };

      if (hasPreferences) {
        // Update existing preferences
        await apiClient.put("/api/preferences/me", formattedPreferences);
      } else {
        // Create new preferences
        await apiClient.post("/api/preferences", formattedPreferences);
      }

      if (onSubmit) {
        await onSubmit(formattedPreferences);
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      setError(error.response?.data?.detail || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  const noteOptions = [
    "Floral",
    "Woody",
    "Citrus",
    "Oriental",
    "Fresh",
    "Spicy",
  ];
  const categoryOptions = ["Eau de Parfum", "Eau de Toilette", "Cologne"];
  const priceRanges = ["low-range", "mid-range", "luxury"];
  const seasons = ["Spring", "Summer", "Fall", "Winter"];
  const strengths = ["Light", "Moderate", "Strong"];

  const handleNoteToggle = (note) => {
    setPreferences((prev) => ({
      ...prev,
      favorite_notes: prev.favorite_notes.includes(note)
        ? prev.favorite_notes.filter((n) => n !== note)
        : [...prev.favorite_notes, note],
    }));
  };

  if (loading) {
    return <div className="flex justify-center items-center">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">
        {hasPreferences
          ? "Update Your Fragrance Preferences"
          : "Find Your Perfect Fragrance"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2">Preferred Notes</label>
          <div className="flex flex-wrap gap-2">
            {noteOptions.map((note) => (
              <button
                key={note}
                type="button"
                onClick={() => handleNoteToggle(note)}
                className={`px-3 py-1 rounded-full ${
                  preferences.favorite_notes.includes(note)
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Category</label>
            <select
              value={preferences.preferred_categories[0] || ""}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  preferred_categories: e.target.value ? [e.target.value] : [],
                }))
              }
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Category</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">Price Range</label>
            <select
              value={preferences.price_range}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  price_range: e.target.value,
                }))
              }
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Price Range</option>
              {priceRanges.map((range) => (
                <option key={range} value={range}>
                  {range
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">Season (Optional)</label>
            <select
              value={preferences.seasonal_preference || ""}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  seasonal_preference: e.target.value,
                }))
              }
              className="w-full p-2 border rounded"
            >
              <option value="">Select Season</option>
              {seasons.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">Scent Strength (Optional)</label>
            <select
              value={preferences.scent_strength || ""}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  scent_strength: e.target.value,
                }))
              }
              className="w-full p-2 border rounded"
            >
              <option value="">Select Strength</option>
              {strengths.map((strength) => (
                <option key={strength} value={strength}>
                  {strength}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:bg-purple-400`}
        >
          {loading ? "Saving..." : "Get Recommendations"}
        </button>
      </form>
    </div>
  );
};

export default PreferencesForm;
