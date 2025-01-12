// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../lib/axios";

const ProductDetail = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await apiClient.get(`/api/products/${id}`);
        setProduct(data);
      } catch (err) {
        setError("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      await apiClient.post("/api/cart/items", {
        product_id: product._id,
        quantity: 1,
      });
      alert("Product added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add product to cart");
    }
  };

  if (loading)
    return (
      <div className='flex justify-center items-center min-h-screen'>
        Loading...
      </div>
    );
  if (error) return <div className='text-red-500 text-center'>{error}</div>;
  if (!product) return null;

  return (
    <div className='max-w-7xl mx-auto px-4 py-8'>
      <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
        <div className='md:flex'>
          <div className='md:w-1/2'>
            <img
              src='/api/placeholder/600/600'
              alt={product.name}
              className='w-full h-[600px] object-cover'
            />
          </div>
          <div className='md:w-1/2 p-8 space-y-6'>
            <div>
              <h1 className='text-3xl font-bold'>{product.name}</h1>
              <p className='text-xl text-gray-600 mt-2'>{product.brand}</p>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center'>
                <span className='text-2xl font-bold text-purple-600'>
                  IDR{product.price}
                </span>
                <span className='ml-2 text-gray-500'>
                  / {product.size_ml}ml
                </span>
              </div>

              <div>
                <h3 className='text-lg font-semibold'>Description</h3>
                <p className='text-gray-600 mt-2'>{product.description}</p>
              </div>

              <div>
                <h3 className='text-lg font-semibold'>Notes</h3>
                <div className='flex flex-wrap gap-2 mt-2'>
                  {product.notes.map((note) => (
                    <span
                      key={note}
                      className='px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm'
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <h3 className='font-semibold'>Category</h3>
                  <p className='text-gray-600'>{product.category}</p>
                </div>
                {product.scent_strength && (
                  <div>
                    <h3 className='font-semibold'>Scent Strength</h3>
                    <p className='text-gray-600'>{product.scent_strength}</p>
                  </div>
                )}
                {product.season && (
                  <div>
                    <h3 className='font-semibold'>Best Season</h3>
                    <p className='text-gray-600'>{product.season}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className='w-full bg-purple-600 text-white py-4 rounded-lg hover:bg-purple-700 transition-colors'
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
