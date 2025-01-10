// src/lib/axios.js
import axios from "axios";

export const apiClient = axios.create({
  baseURL: "https://perfume-app-production.up.railway.app",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const fetchProducts = async () => {
  const response = await apiClient.get(`/api/products`);
  return response.data;
};

// Pencarian produk
export const searchProducts = async (query) => {
  const response = await apiClient.get(`/api/products`, {
    params: { search: query },
  });
  return response.data;
};
