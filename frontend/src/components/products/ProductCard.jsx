// src/components/product/ProductCard.jsx
// src/components/product/ProductCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { cartAPI } from "../../lib/axios";

const ProductCard = ({ product, onAddToCart }) => {
  const navigate = useNavigate();

  const handleAddToCart = async (e) => {
    e.preventDefault(); // Prevent event bubbling
    try {
      await cartAPI.addItem(product._id, 1);
      if (onAddToCart) {
        onAddToCart();
      }
      showNotification("Added to cart successfully!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      showNotification("Failed to add item to cart", "error");
    }
  };

  const showNotification = (message, type = "success") => {
    const notification = document.createElement("div");
    notification.className = `fixed bottom-4 right-4 bg-${
      type === "success" ? "green" : "red"
    }-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 translate-y-0 z-50`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.transform = "translateY(200%)";
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  };

  return (
    <div
      onClick={() => navigate(`/product/${product._id}`)}
      className='group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer'
    >
      <div className='relative'>
        <img
          src='/api/placeholder/300/300'
          alt={product.name}
          className='w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-300'
        />
        <div className='absolute top-2 right-2'>
          <button
            onClick={handleAddToCart}
            className='bg-white text-purple-600 p-2 rounded-full shadow hover:bg-purple-600 hover:text-white transition-colors'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
              />
            </svg>
          </button>
        </div>
      </div>

      <div className='p-4'>
        <div className='mb-2'>
          <h3 className='text-lg font-semibold text-gray-800 group-hover:text-purple-600 transition-colors'>
            {product.name}
          </h3>
          <p className='text-gray-600'>{product.brand}</p>
        </div>

        <div className='space-y-2'>
          <div className='flex flex-wrap gap-1'>
            {product.notes.slice(0, 3).map((note, index) => (
              <span
                key={index}
                className='px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full'
              >
                {note}
              </span>
            ))}
            {product.notes.length > 3 && (
              <span className='px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full'>
                +{product.notes.length - 3} more
              </span>
            )}
          </div>

          <div className='flex justify-between items-center'>
            <span className='text-lg font-bold text-purple-600'>
              IDR{product.price}
            </span>
            <span className='text-sm text-gray-500'>{product.size_ml}ml</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
