// src/pages/HomePage.jsx
import React, { useState, useEffect } from "react";
import Shield from "lucide-react/icons/shield";
import Truck from "lucide-react/icons/truck";
import Award from "lucide-react/icons/award";
import Gift from "lucide-react/icons/gift";
import PreferencesForm from "../components/preferences/PreferencesForm";
import ProductCard from "../components/products/ProductCard";
import { apiClient } from "../lib/axios";

const StoreFeature = ({ icon: Icon, title, description }) => (
  <div className='flex flex-col items-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow'>
    <div className='p-3 bg-purple-100 rounded-full mb-4'>
      <Icon className='h-6 w-6 text-purple-600' />
    </div>
    <h3 className='text-lg font-semibold text-gray-900 mb-2'>{title}</h3>
    <p className='text-gray-600 text-center'>{description}</p>
  </div>
);

const Homepage = () => {
  const [hasPreferences, setHasPreferences] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const storeFeatures = [
    {
      icon: Shield,
      title: "100% Authentic",
      description:
        "All our perfumes are guaranteed authentic with official certification",
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Free shipping for orders above Rp 500,000",
    },
    {
      icon: Award,
      title: "Best Quality",
      description:
        "Curated selection of premium fragrances from around the world",
    },
    {
      icon: Gift,
      title: "Special Offers",
      description: "Regular promotions and exclusive deals for our customers",
    },
  ];

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

  const handlePreferencesSubmit = async () => {
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
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600'></div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto px-4 py-8'>
      {/* Hero Section */}
      <div className='text-center mb-16'>
        <h1 className='text-4xl font-bold text-gray-900 mb-4'>
          Discover Your Perfect Fragrance
        </h1>
        <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
          Experience our curated collection of premium perfumes, tailored to
          your preferences
        </p>
      </div>

      {/* Store Features */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16'>
        {storeFeatures.map((feature, index) => (
          <StoreFeature key={index} {...feature} />
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className='bg-red-50 text-red-700 p-4 rounded-lg mb-8'>
          <p>{error}</p>
        </div>
      )}

      {/* Preferences and Recommendations */}
      <div className='space-y-8'>
        {!hasPreferences ? (
          <div className='bg-white p-8 rounded-lg shadow-sm'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>
              Set Your Fragrance Preferences
            </h2>
            <PreferencesForm onSubmit={handlePreferencesSubmit} />
          </div>
        ) : (
          <div className='space-y-8'>
            <div className='flex justify-between items-center'>
              <h2 className='text-2xl font-bold text-gray-900'>
                Recommended for You
              </h2>
              <button
                onClick={() => setHasPreferences(false)}
                className='text-purple-600 hover:text-purple-700 font-medium'
              >
                Update Preferences
              </button>
            </div>

            {recommendations.length === 0 ? (
              <div className='text-center py-12 bg-gray-50 rounded-lg'>
                <p className='text-gray-600'>
                  No recommendations found. Try updating your preferences.
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                {recommendations.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;
