// src/components/checkout/Checkout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/axios";
import PaymentModal from "./PaymentModal";

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    address: "",
    city: "",
    country: "",
    postal_code: "", // sesuaikan dengan backend
    phone: "",
  });
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
    } finally {
      setLoading(false);
    }
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format shipping info sesuai ekspektasi backend
      const formattedShippingInfo = {
        address: shippingInfo.address,
        city: shippingInfo.city,
        country: shippingInfo.country,
        postal_code: shippingInfo.postalCode, // sesuaikan nama field
        phone: shippingInfo.phone,
      };

      // Checkout request
      const { data: orderData } = await apiClient.post("/api/checkout", {
        shipping_info: formattedShippingInfo,
      });

      // Payment request dengan currency
      const { data: paymentData } = await apiClient.post(
        "/api/payment/create",
        {
          order_id: orderData.order_id,
          amount: cart.total_amount,
          currency: "USDT", // tambahkan currency
        }
      );

      setPaymentInfo(paymentData.data);
      setShowPaymentModal(true);
    } catch (error) {
      setError("Failed to process checkout");
      console.error(error);
    }
  };

  if (loading)
    return <div className='flex justify-center items-center'>Loading...</div>;
  if (error) return <div className='text-red-500'>{error}</div>;
  if (!cart) return null;

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <h2 className='text-2xl font-bold mb-6'>Checkout</h2>

      <div className='bg-white rounded-lg shadow p-6 mb-6'>
        <h3 className='text-xl font-semibold mb-4'>Order Summary</h3>
        <div className='space-y-4'>
          {cart.items.map((item) => (
            <div key={item.product_id} className='flex justify-between'>
              <span>
                {item.name} x {item.quantity}
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className='border-t pt-4 font-bold'>
            <span>Total: ${cart.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleShippingSubmit}
        className='bg-white rounded-lg shadow p-6'
      >
        <h3 className='text-xl font-semibold mb-4'>Shipping Information</h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Address</label>
            <input
              type='text'
              required
              className='w-full border rounded p-2'
              value={shippingInfo.address}
              onChange={(e) =>
                setShippingInfo({ ...shippingInfo, address: e.target.value })
              }
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>City</label>
              <input
                type='text'
                required
                className='w-full border rounded p-2'
                value={shippingInfo.city}
                onChange={(e) =>
                  setShippingInfo({ ...shippingInfo, city: e.target.value })
                }
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Postal Code
              </label>
              <input
                type='text'
                required
                className='w-full border rounded p-2'
                value={shippingInfo.postal_code}
                onChange={(e) =>
                  setShippingInfo({
                    ...shippingInfo,
                    postal_code: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Country</label>
            <input
              type='text'
              required
              className='w-full border rounded p-2'
              value={shippingInfo.country}
              onChange={(e) =>
                setShippingInfo({ ...shippingInfo, country: e.target.value })
              }
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Phone</label>
            <input
              type='tel'
              required
              className='w-full border rounded p-2'
              value={shippingInfo.phone}
              onChange={(e) =>
                setShippingInfo({ ...shippingInfo, phone: e.target.value })
              }
            />
          </div>
          <button
            type='submit'
            className='w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700'
          >
            Proceed to Payment
          </button>
        </div>
      </form>

      {showPaymentModal && paymentInfo && (
        <PaymentModal
          paymentInfo={paymentInfo}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => navigate("/orders")}
        />
      )}
    </div>
  );
};

export default Checkout;
