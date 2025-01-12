// src/components/cart/Cart.jsx
import React, { useState, useEffect } from "react";
import { cartAPI, checkoutAPI } from "../../lib/axios";
import PaymentModal from "../checkout/PaymentModal";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const data = await cartAPI.getCart();
      setCart(data);
    } catch (error) {
      setError("Failed to load cart");
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    try {
      await cartAPI.updateItem(productId, newQuantity);
      fetchCart();
      showNotification("Quantity updated successfully", "success");
    } catch (error) {
      console.error("Error updating quantity:", error);
      showNotification("Failed to update quantity", "error");
    }
  };

  const removeItem = async (productId) => {
    try {
      await cartAPI.updateItem(productId, 0);
      fetchCart();
      showNotification("Item removed from cart", "success");
    } catch (error) {
      console.error("Error removing item:", error);
      showNotification("Failed to remove item", "error");
    }
  };

  const handleCheckout = async () => {
    setProcessingCheckout(true);
    try {
      const checkoutData = await checkoutAPI.createCheckout();
      setPaymentInfo(checkoutData);
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Error during checkout:", error);
      showNotification("Failed to process checkout", "error");
    } finally {
      setProcessingCheckout(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    fetchCart(); // Cart will be cleared by backend after successful payment
    showNotification("Payment completed successfully!", "success");
  };

  const showNotification = (message, type = "success") => {
    const notification = document.createElement("div");
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.transform = "translateY(200%)";
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  };

  if (loading)
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600'></div>
      </div>
    );

  if (error)
    return (
      <div className='text-red-500 p-4 text-center bg-red-50 rounded-lg'>
        {error}
      </div>
    );

  if (!cart) return null;

  return (
    <div className='bg-white rounded-lg shadow-sm'>
      {cart.items.length === 0 ? (
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
                d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
              />
            </svg>
          </div>
          <p className='text-gray-500 text-lg'>Your cart is empty</p>
        </div>
      ) : (
        <div className='divide-y divide-gray-100'>
          {cart.items.map((item) => (
            <div
              key={item.product_id}
              className='p-6 flex items-center justify-between hover:bg-gray-50 transition-colors'
            >
              <div className='flex items-center space-x-6'>
                <img
                  src='/api/placeholder/120/120'
                  alt={item.name}
                  className='w-24 h-24 object-cover rounded-lg'
                />
                <div>
                  <h3 className='font-semibold text-lg text-gray-800'>
                    {item.name}
                  </h3>
                  <p className='text-purple-600 font-medium'>IDR{item.price}</p>
                </div>
              </div>
              <div className='flex items-center space-x-6'>
                <select
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.product_id, Number(e.target.value))
                  }
                  className='border rounded-lg py-2 px-3 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition-shadow'
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className='text-red-500 hover:text-red-700 transition-colors'
                >
                  <svg
                    className='h-6 w-6'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          <div className='p-6 bg-gray-50'>
            <div className='flex justify-between items-center mb-6'>
              <div>
                <p className='text-gray-600'>
                  Total Items: {cart.items.length}
                </p>
                <p className='text-2xl font-bold text-purple-600'>
                  IDR{cart.total_amount.toFixed(2)}
                </p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={processingCheckout}
                className={`px-8 py-3 rounded-lg text-white font-medium transition-all transform hover:scale-105 ${
                  processingCheckout
                    ? "bg-purple-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {processingCheckout ? (
                  <span className='flex items-center'>
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
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && paymentInfo && (
        <PaymentModal
          paymentInfo={paymentInfo}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default Cart;
