// src/components/product/ProductList.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";

const ProductList = ({ searchResults }) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("name");

  const getSortedResults = () => {
    return [...searchResults].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };

  if (!searchResults.length) {
    return (
      <div className='text-center py-16'>
        <div className='text-gray-400 mb-4'>
          <svg
            className='mx-auto h-16 w-16'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1}
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </div>
        <p className='text-gray-500 text-lg'>No products found</p>
        <p className='text-gray-400'>Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <p className='text-gray-600'>Found {searchResults.length} products</p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className='border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none'
        >
          <option value='name'>Sort by Name</option>
          <option value='price-low'>Price: Low to High</option>
          <option value='price-high'>Price: High to Low</option>
        </select>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {getSortedResults().map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onClick={() => navigate(`/product/${product._id}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
