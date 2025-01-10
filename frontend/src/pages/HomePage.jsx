// src/pages/Homepage.jsx
import React, { useState, useEffect } from "react";
import PreferencesForm from "../components/preferences/PreferencesForm";
import ProductCard from "../components/products/ProductCard";
import { apiClient } from "../lib/axios";
import MainLayout from "../components/Layout/MainLayout";

const Homepage = () => {
  const [hasPreferences, setHasPreferences] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkPreferences();
  }, []);

  const checkPreferences = async () => {
    try {
      const response = await apiClient.get("/api/preferences/me");
      if (response.data) {
        setHasPreferences(true);
        fetchRecommendations();
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setHasPreferences(false);
      } else {
        setError("Error checking preferences");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const { data } = await apiClient.get("/api/recommendations");
      setRecommendations(data);
    } catch (error) {
      setError("Failed to fetch recommendations");
    }
  };

  const handlePreferencesSubmit = async (preferences) => {
    try {
      setLoading(true);
      await fetchRecommendations();
      setHasPreferences(true);
    } catch (error) {
      setError("Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-8 px-4">
        {!hasPreferences ? (
          <PreferencesForm onSubmit={handlePreferencesSubmit} />
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Recommended for You</h2>
              <button
                onClick={() => setHasPreferences(false)}
                className="text-purple-600 hover:text-purple-700"
              >
                Update Preferences
              </button>
            </div>

            {recommendations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No recommendations found. Try updating your preferences.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendations.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Homepage;
