// src/components/checkout/PaymentModal.jsx
import React, { useState, useEffect } from "react";
import { apiClient } from "../../lib/axios";
import { checkSolstraPayment } from "../../lib/solstraApi";
import Copy from "lucide-react/icons/copy";

const PaymentModal = ({ paymentInfo, onClose, onSuccess }) => {
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [remainingTime, setRemainingTime] = useState(900); // 15 minutes
  const [selectedCurrency, setSelectedCurrency] = useState(
    paymentInfo.currency || "USDT"
  );

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // 1. Check status dengan Solstra API langsung
        const solstraResponse = await checkSolstraPayment(paymentInfo.id);

        if (solstraResponse.data.data.isPaid) {
          // 2. Update status di backend kita jika payment confirmed
          await apiClient.post(`/api/payment/check/${paymentInfo.id}`);
          setPaymentStatus("completed");
          onSuccess();
        }
      } catch (error) {
        console.error("Payment check failed:", error);
        setError("Failed to check payment status");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [paymentInfo.id, onSuccess, onClose]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(paymentInfo.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address");
    }
  };

  const handleCurrencyChange = async (currency) => {
    try {
      setError(null);

      // Gunakan apiClient untuk update di backend kita
      const { data } = await apiClient.post("/api/payment/update-currency", {
        payment_id: paymentInfo.id,
        currency,
      });

      setSelectedCurrency(currency);
      paymentInfo.walletAddress = data.walletAddress;
      paymentInfo.amount = data.amount;
      paymentInfo.currency = currency;
    } catch (error) {
      console.error("Currency update failed:", error);
      setError("Failed to update currency. Please try again.");
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full m-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-xl font-semibold'>Crypto Payment</h3>
          <button
            onClick={onClose}
            className='text-gray-500 hover:text-gray-700'
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className='text-red-500 mb-4'>{error}</div>
        ) : (
          <div className='space-y-6'>
            <div className='text-center'>
              <div className='text-sm text-gray-500 mb-2'>
                Time remaining: {formatTime(remainingTime)}
              </div>

              <div className='mb-4'>
                <label className='block text-sm font-medium mb-2'>
                  Select Currency:
                </label>
                <div className='flex justify-center gap-2'>
                  <button
                    className={`px-4 py-2 rounded ${
                      selectedCurrency === "USDT"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    onClick={() => handleCurrencyChange("USDT")}
                  >
                    USDT
                  </button>
                  <button
                    className={`px-4 py-2 rounded ${
                      selectedCurrency === "SOL"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    onClick={() => handleCurrencyChange("SOL")}
                  >
                    SOL
                  </button>
                </div>
              </div>

              <p className='font-medium'>Amount to Pay:</p>
              <p className='text-2xl font-bold mt-1'>
                {paymentInfo.amount} {selectedCurrency}
              </p>
            </div>

            <div className='space-y-2'>
              <p className='font-medium text-center'>
                Send to this wallet address:
              </p>
              <div className='relative'>
                <div className='bg-gray-50 p-4 rounded-lg break-all text-sm'>
                  {paymentInfo.walletAddress}
                </div>
                <button
                  onClick={handleCopyAddress}
                  className='absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors'
                  title='Copy address'
                >
                  <Copy size={20} />
                </button>
              </div>
              {copied && (
                <p className='text-green-500 text-sm text-center'>
                  Address copied!
                </p>
              )}
            </div>

            <div className='rounded-lg border border-gray-200 p-4'>
              <p className='font-medium mb-2'>Important:</p>
              <ul className='list-disc list-inside space-y-2 text-sm text-gray-600'>
                <li>
                  Send exactly {paymentInfo.amount} {selectedCurrency}
                </li>
                <li>Include all transaction fees</li>
                <li>
                  Payment will expire in {Math.floor(remainingTime / 60)}{" "}
                  minutes
                </li>
                <li>Only send {selectedCurrency} on the correct network</li>
              </ul>
            </div>

            <div className='text-center'>
              {paymentStatus === "pending" ? (
                <div className='animate-pulse text-yellow-600'>
                  Waiting for payment confirmation...
                </div>
              ) : (
                <div className='text-green-600 font-semibold'>
                  Payment confirmed! Redirecting...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
