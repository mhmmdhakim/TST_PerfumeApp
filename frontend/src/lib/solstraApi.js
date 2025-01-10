import { apiClient } from "./axios";

// We'll use our backend as a proxy to Solstra API for better security
export const checkSolstraPayment = async (paymentId) => {
  try {
    const response = await apiClient.post(`/api/payment/check/${paymentId}`);
    return response;
  } catch (error) {
    console.error("Error checking payment:", error);
    throw error;
  }
};
