import React from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/axios";

const ProductCard = ({ product, onAddToCart }) => {
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    try {
      const response = await apiClient.post("/api/cart/items", {
        product_id: product._id,
        quantity: 1,
      });
      alert("Item added to cart successfully!"); // Notifikasi sukses
      if (onAddToCart) {
        onAddToCart();
      }
    } catch (error) {
      alert("Failed to add item to cart."); // Notifikasi gagal
      console.error("Error adding to cart:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img
        src="/api/placeholder/300/300"
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-gray-600">{product.brand}</p>
        <div className="mt-2 space-y-2">
          <p className="text-sm text-gray-500">Category: {product.category}</p>
          <p className="text-sm text-gray-500">
            Notes: {product.notes.join(", ")}
          </p>
          <p className="text-purple-600 font-bold">${product.price}</p>
        </div>
        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
          >
            Add to Cart
          </button>
          <button
            onClick={() => navigate(`/product/${product._id}`)}
            className="flex-1 border border-purple-600 text-purple-600 py-2 px-4 rounded hover:bg-purple-50"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
