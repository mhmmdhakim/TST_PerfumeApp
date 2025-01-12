// src/pages/CartPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import Cart from "../components/cart/Cart";

const CartPage = () => {
  return (
    <div className='max-w-7xl mx-auto px-4 py-8'>
      <div className='mb-6'>
        <div className='flex items-center space-x-2 text-gray-500 mb-2'>
          <Link to='/' className='hover:text-purple-600'>
            Home
          </Link>
          <span>/</span>
          <span className='text-gray-800'>Shopping Cart</span>
        </div>
        <h1 className='text-3xl font-bold text-gray-900'>Shopping Cart</h1>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2'>
          <Cart />
        </div>

        <div className='lg:col-span-1'>
          <div className='bg-white rounded-lg shadow-sm p-6 space-y-6'>
            <h2 className='text-lg font-semibold border-b pb-4'>
              Order Summary
            </h2>

            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Shipping</span>
                <span className='font-medium'>Free</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Payment Method</span>
                <span className='font-medium'>Crypto (SOL/USDT)</span>
              </div>
            </div>

            <div className='border-t pt-4'>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Total Amount</span>
                <span className='text-xl font-bold text-purple-600'>
                  Calculated at checkout
                </span>
              </div>
            </div>

            <div className='space-y-4'>
              <div className='p-4 bg-purple-50 rounded-lg'>
                <h3 className='font-medium text-purple-800 mb-2'>
                  Crypto Payment
                </h3>
                <p className='text-sm text-purple-600'>
                  We accept payments in SOL and USDT. You'll be able to choose
                  your preferred currency at checkout.
                </p>
              </div>

              <div className='p-4 bg-green-50 rounded-lg'>
                <h3 className='font-medium text-green-800 mb-2'>
                  Secure Transaction
                </h3>
                <p className='text-sm text-green-600'>
                  All transactions are processed securely through our payment
                  provider.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
