import React, { useState, useEffect } from "react";
import { apiClient } from "../../lib/axios";
import PaymentModal from "../checkout/PaymentModal";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const { data } = await apiClient.get("/api/cart");
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
      await apiClient.put(`/api/cart/items/${productId}`, {
        product_id: productId,
        quantity: newQuantity,
      });
      fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const removeItem = async (productId) => {
    try {
      await apiClient.put(`/api/cart/items/${productId}`, {
        product_id: productId,
        quantity: 0,
      });
      fetchCart();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleCheckout = async () => {
    try {
      const { data } = await apiClient.post("/api/checkout");
      setPaymentInfo(data);
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Error during checkout:", error);
      setError("Failed to process checkout");
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    fetchCart(); // Refresh cart after successful payment
  };

  if (loading)
    return <div className='flex justify-center items-center'>Loading...</div>;
  if (error) return <div className='text-red-500'>{error}</div>;
  if (!cart) return null;

  return (
    <div className='bg-white rounded-lg shadow p-6'>
      {cart.items.length === 0 ? (
        <div className='text-center py-8'>
          <p className='text-gray-500'>Your cart is empty</p>
        </div>
      ) : (
        <div className='space-y-6'>
          {cart.items.map((item) => (
            <div
              key={item.product_id}
              className='flex items-center justify-between border-b pb-4'
            >
              <div className='flex items-center space-x-4'>
                <img
                  src='/api/placeholder/100/100'
                  alt={item.name}
                  className='w-20 h-20 object-cover rounded'
                />
                <div>
                  <h3 className='font-semibold'>{item.name}</h3>
                  <p className='text-gray-600'>${item.price}</p>
                </div>
              </div>
              <div className='flex items-center space-x-4'>
                <select
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.product_id, Number(e.target.value))
                  }
                  className='border rounded p-1'
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className='text-red-500 hover:text-red-700'
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className='flex justify-between items-center pt-4'>
            <div className='text-xl font-semibold'>
              Total: ${cart.total_amount.toFixed(2)}
            </div>
            <button
              onClick={handleCheckout}
              className='bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700'
            >
              Proceed to Payment
            </button>
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
