// src/components/checkout/PaymentModal.jsx
import React, { useState, useEffect } from "react";
import { checkoutAPI } from "../../lib/axios";

const PaymentModal = ({ paymentInfo, onClose, onSuccess }) => {
	const [selectedCurrency, setSelectedCurrency] = useState("SOL");
	const [paymentData, setPaymentData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [paymentStatus, setPaymentStatus] = useState("pending");

	// Konstanta untuk rate
	const RATES = {
		SOL: 3200000,
		USDT: 16000,
	};

	const formatCryptoAmount = (amount, currency) => {
		if (typeof amount !== "number") {
			amount = parseFloat(amount);
		}
		return `${amount.toFixed(8).replace(/\.?0+$/, "")} ${currency}`;
	};

	const formatIDR = (amount) => {
		return `Rp ${parseInt(amount).toLocaleString("id-ID")}`;
	};

	const getConvertedAmount = (amountIDR, currency) => {
		const rate = RATES[currency];
		if (!rate) return 0;
		const converted = amountIDR / rate;
		return formatCryptoAmount(converted, currency);
	};

	const initializePayment = async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await checkoutAPI.createPayment(
				paymentInfo.order_id,
				selectedCurrency
			);
			setPaymentData(data);
			startPollingPaymentStatus(paymentInfo.order_id);
		} catch (err) {
			console.error("Payment initialization error:", err);
			setError(
				err.response?.data?.detail ||
					"Failed to initialize payment. Please try again."
			);
		} finally {
			setLoading(false);
		}
	};

	const checkStatus = async (orderId) => {
		try {
			const data = await checkoutAPI.checkPaymentStatus(orderId);
			if (data.isPaid) {
				setPaymentStatus("completed");
				onSuccess();
				return true;
			}
			return false;
		} catch (error) {
			console.error("Error checking payment status:", error);
			return false;
		}
	};

	const startPollingPaymentStatus = (orderId) => {
		const pollInterval = setInterval(async () => {
			const isComplete = await checkStatus(orderId);
			if (isComplete) {
				clearInterval(pollInterval);
			}
		}, 5000);

		return () => clearInterval(pollInterval);
	};

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
			<div className='bg-white rounded-lg p-8 max-w-lg w-full mx-4 relative'>
				<button
					onClick={onClose}
					className='absolute top-4 right-4 text-gray-500 hover:text-gray-700'
				>
					✕
				</button>

				<h2 className='text-2xl font-bold mb-6'>Complete Your Payment</h2>

				{!paymentData ? (
					<div className='space-y-6'>
						<div className='p-4 bg-gray-50 rounded-md space-y-3'>
							<div className='space-y-1'>
								<p className='text-sm text-gray-600'>Original Amount (IDR):</p>
								<p className='text-xl font-bold'>
									{formatIDR(paymentInfo.total_amount_idr)}
								</p>
							</div>

							<div className='space-y-1'>
								<p className='text-sm text-gray-600'>Converted Amount:</p>
								<p className='text-lg text-purple-600 font-medium'>
									{getConvertedAmount(
										paymentInfo.total_amount_idr,
										selectedCurrency
									)}
								</p>
								<p className='text-xs text-gray-500'>
									Rate: 1 {selectedCurrency} ={" "}
									{formatIDR(RATES[selectedCurrency])}
								</p>
							</div>
						</div>

						<div className='space-y-2'>
							<label className='block text-sm font-medium text-gray-700'>
								Select Payment Currency
							</label>
							<select
								value={selectedCurrency}
								onChange={(e) => setSelectedCurrency(e.target.value)}
								className='block w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
							>
								<option value='SOL'>Solana (SOL)</option>
								<option value='USDT'>Tether (USDT)</option>
							</select>
						</div>

						<button
							onClick={initializePayment}
							disabled={loading}
							className='w-full bg-purple-600 text-white py-3 rounded-md hover:bg-purple-700 disabled:bg-purple-300 transition-colors duration-200'
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
									Initializing Payment...
								</span>
							) : (
								"Proceed with Payment"
							)}
						</button>
					</div>
				) : (
					<div className='space-y-6'>
						<div className='p-4 bg-gray-50 rounded-md space-y-3'>
							<div className='flex justify-between items-center border-b pb-2'>
								<span className='text-sm text-gray-600'>Amount to Pay:</span>
								<span className='text-xl font-bold font-mono'>
									{formatCryptoAmount(
										parseFloat(paymentData.amount || 0),
										paymentData.currency
									)}
								</span>
							</div>
							<div className='text-sm text-gray-500'>
								Original Amount: {formatIDR(paymentInfo.total_amount_idr)}
							</div>
							<div className='text-xs text-gray-400'>
								Rate: 1 {selectedCurrency} ={" "}
								{formatIDR(RATES[selectedCurrency])}
							</div>
						</div>

						<div className='space-y-2'>
							<p className='text-sm font-medium text-gray-600'>
								Payment Address:
							</p>
							<div className='p-4 bg-gray-50 rounded-md space-y-2'>
								<div className='break-all font-mono text-sm bg-white p-3 rounded border'>
									{paymentData.walletAddress}
								</div>
								<div className='flex justify-end'>
									<button
										onClick={() => {
											navigator.clipboard.writeText(paymentData.walletAddress);
											alert("Address copied to clipboard!");
										}}
										className='text-sm text-purple-600 hover:text-purple-700 flex items-center'
									>
										<svg
											className='w-4 h-4 mr-1'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth='2'
												d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
											/>
										</svg>
										Copy Address
									</button>
								</div>
							</div>
							{selectedCurrency === "SOL" && (
								<a
									href={paymentData.solanaPayLink}
									className='block w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium bg-purple-50 p-3 rounded-md hover:bg-purple-100 transition-colors mt-2'
									target='_blank'
									rel='noopener noreferrer'
								>
									Open in Solana Wallet
								</a>
							)}
						</div>

						{paymentStatus === "completed" ? (
							<div className='text-center p-4 bg-green-50 text-green-700 rounded-md'>
								<svg
									className='w-6 h-6 mx-auto mb-2'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M5 13l4 4L19 7'
									/>
								</svg>
								Payment Completed Successfully!
							</div>
						) : (
							<div className='text-center p-4 bg-yellow-50 text-yellow-700 rounded-md'>
								<svg
									className='w-6 h-6 mx-auto mb-2 animate-spin'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
									/>
								</svg>
								Waiting for payment confirmation...
							</div>
						)}

						<div className='mt-6 space-y-4 text-sm text-gray-600'>
							<div className='p-4 bg-blue-50 rounded-md'>
								<h3 className='font-medium text-blue-800 mb-3'>
									Payment Instructions:
								</h3>
								<ol className='list-decimal list-inside space-y-2'>
									<li>Copy the wallet address above</li>
									<li>Open your {selectedCurrency} wallet</li>
									<li>Send exactly {paymentData.convertedAmount}</li>
									<li>Wait for confirmation (usually takes 1-2 minutes)</li>
								</ol>
							</div>

							<div className='p-4 bg-yellow-50 rounded-md'>
								<h3 className='font-medium text-yellow-800 mb-3'>
									Important Notes:
								</h3>
								<ul className='list-disc list-inside space-y-1'>
									<li>Make sure to send the exact amount</li>
									<li>Only send {selectedCurrency} to this address</li>
									<li>Payment window closes in 30 minutes</li>
									{selectedCurrency === "SOL" && (
										<li>Use Solana network for the transaction</li>
									)}
									{selectedCurrency === "USDT" && (
										<li>Use USDT on Solana network (SPL Token)</li>
									)}
								</ul>
							</div>
						</div>
					</div>
				)}

				{error && (
					<div className='mt-4 p-4 bg-red-50 text-red-700 rounded-md'>
						{error}
					</div>
				)}
			</div>
		</div>
	);
};

export default PaymentModal;
