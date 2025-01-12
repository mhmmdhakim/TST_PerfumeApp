// src/components/checkout/Checkout.jsx
import React, { useState } from "react";
import { apiClient } from "../../lib/axios";
import PaymentModal from "./PaymentModal";

const Checkout = ({ cart, onCheckoutComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);

  const initiateCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create checkout session
      const { data: checkoutResponse } = await apiClient.post("/api/checkout");

      setCheckoutData({
        orderId: checkoutResponse.order_id,
        status: checkoutResponse.status,
      });

      setShowPaymentModal(true);
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.response?.data?.detail || "Failed to initiate checkout");
      showNotification("Failed to initiate checkout", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    if (onCheckoutComplete) {
      onCheckoutComplete();
    }
    showNotification("Payment completed successfully!", "success");
  };

  const showNotification = (message, type = "success") => {
    const notification = document.createElement("div");
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    } text-white z-50`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transform = "translateY(200%)";
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  };

  // Summary of items in cart
  const renderCartSummary = () => (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Order Summary</h3>
      <div className='space-y-2'>
        {cart.items.map((item) => (
          <div key={item.product_id} className='flex justify-between'>
            <span className='text-gray-600'>
              {item.name} x {item.quantity}
            </span>
            <span className='font-medium'>
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <div className='border-t pt-4'>
        <div className='flex justify-between text-lg font-bold'>
          <span>Total</span>
          <span className='text-purple-600'>
            ${cart.total_amount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className='bg-white rounded-lg shadow p-6'>
      {error && (
        <div className='mb-4 p-4 bg-red-50 text-red-600 rounded-lg'>
          {error}
        </div>
      )}

      {renderCartSummary()}

      <div className='mt-6'>
        <button
          onClick={initiateCheckout}
          disabled={loading || cart.items.length === 0}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all 
            ${
              loading || cart.items.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 transform hover:scale-105"
            }`}
        >
          {loading ? (
            <span className='flex items-center justify-center'>
              <svg
                className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              Processing...
            </span>
          ) : (
            "Proceed to Payment"
          )}
        </button>

        {/* Payment instructions */}
        <div className='mt-6 p-4 bg-gray-50 rounded-lg space-y-2'>
          <h4 className='font-medium text-gray-700'>Payment Information</h4>
          <p className='text-sm text-gray-600'>
            • We accept payments in SOL and USDT
          </p>
          <p className='text-sm text-gray-600'>
            • Payment confirmation may take a few minutes
          </p>
          <p className='text-sm text-gray-600'>
            • Your cart will be cleared after successful payment
          </p>
        </div>
      </div>

      {showPaymentModal && checkoutData && (
        <PaymentModal
          paymentInfo={checkoutData}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default Checkout;
