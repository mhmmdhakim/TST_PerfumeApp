// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import Package from "lucide-react/icons/package";
import Mail from "lucide-react/icons/mail";
import User from "lucide-react/icons/user";
import { useAuth } from "../context/AuthContext";
import { checkoutAPI } from "../lib/axios";

const Profile = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await checkoutAPI.getOrders();
      setOrders(data);
    } catch (err) {
      setError("Failed to fetch orders");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600'></div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto px-4 py-8'>
      <div className='space-y-8'>
        {/* Profile Information */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            Profile Information
          </h2>
          <div className='space-y-4'>
            <div className='flex items-center space-x-4'>
              <div className='p-3 bg-purple-100 rounded-full'>
                <User className='h-6 w-6 text-purple-600' />
              </div>
              <div>
                <p className='text-sm text-gray-500'>Full Name</p>
                <p className='text-lg font-medium'>{user.full_name}</p>
              </div>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='p-3 bg-purple-100 rounded-full'>
                <Mail className='h-6 w-6 text-purple-600' />
              </div>
              <div>
                <p className='text-sm text-gray-500'>Email</p>
                <p className='text-lg font-medium'>{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            Order History
          </h2>
          {error ? (
            <div className='text-center py-4 text-red-600'>{error}</div>
          ) : orders.length === 0 ? (
            <div className='text-center py-8'>
              <Package className='h-16 w-16 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-500'>No orders found</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {orders.map((order) => (
                <div
                  key={order._id}
                  className='border rounded-lg p-4 hover:bg-gray-50 transition-colors'
                >
                  <div className='flex justify-between items-start mb-4'>
                    <div>
                      <p className='text-lg font-medium'>
                        Order #{order._id.slice(-6)}
                      </p>
                      <p className='text-sm text-gray-500'>
                        {new Date(order.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className='space-y-3'>
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className='flex justify-between items-center text-sm'
                      >
                        <div className='flex items-center space-x-4'>
                          <img
                            src='/api/placeholder/48/48'
                            alt={item.name}
                            className='w-12 h-12 rounded object-cover'
                          />
                          <div>
                            <p className='font-medium'>{item.name}</p>
                            <p className='text-gray-500'>
                              Quantity: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className='font-medium'>
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className='border-t mt-4 pt-4 flex justify-between items-center'>
                    <p className='font-medium'>Total Amount</p>
                    <p className='text-lg font-bold text-purple-600'>
                      ${order.total_amount.toFixed(2)}
                    </p>
                  </div>

                  {/* Payment Details if available */}
                  {order.payment_currency && (
                    <div className='mt-2 text-sm text-gray-500'>
                      Payment: {order.payment_currency} • Wallet:{" "}
                      {order.payment_wallet
                        ? `${order.payment_wallet.slice(
                            0,
                            6
                          )}...${order.payment_wallet.slice(-4)}`
                        : "N/A"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
