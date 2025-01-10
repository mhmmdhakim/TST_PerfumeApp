import React, { useState } from "react";
import Search from "lucide-react/icons/search";
import ShoppingCart from "lucide-react/icons/shopping-cart";
import User from "lucide-react/icons/user";
import { useNavigate } from "react-router-dom";
import { searchProducts } from "../../lib/axios"; // Import fungsi pencarian

const Navbar = ({ onSearchResults }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const results = await searchProducts(searchQuery);
      onSearchResults(Array.isArray(results) ? results : []); // Validasi hasil
      navigate("/products");
    } catch (error) {
      console.error("Error searching products:", error);
      onSearchResults([]); // Set array kosong jika terjadi error
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="h-8" />
          </div>
          <h1 className="text-2xl font-bold text-purple-600">FragranceWorld</h1>

          <div className="flex-1 max-w-xl px-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search perfumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button type="submit" className="absolute right-3 top-2.5">
                <Search className="h-5 w-5 text-gray-400" />
              </button>
            </form>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={() => navigate("/cart")} className="p-2">
              <ShoppingCart className="h-6 w-6" />
            </button>
            <button onClick={() => navigate("/account")} className="p-2">
              <User className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
