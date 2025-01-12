// src/lib/axios.js
import axios from "axios";

export const apiClient = axios.create({
  baseURL: "https://perfume-app-production.up.railway.app",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
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

// Response interceptor
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

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await apiClient.put("/auth/me", userData);
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getAll: async (params) => {
    const response = await apiClient.get("/api/products", { params });
    return response.data;
  },

  search: async (query) => {
    const response = await apiClient.get("/api/products", {
      params: { search: query },
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/api/products/${id}`);
    return response.data;
  },

  getFiltered: async ({
    category,
    brand,
    minPrice,
    maxPrice,
    skip = 0,
    limit = 10,
  }) => {
    const response = await apiClient.get("/api/products", {
      params: {
        category,
        brand,
        min_price: minPrice,
        max_price: maxPrice,
        skip,
        limit,
      },
    });
    return response.data;
  },
};

// Cart API
export const cartAPI = {
  getCart: async () => {
    const response = await apiClient.get("/api/cart");
    return response.data;
  },

  addItem: async (productId, quantity) => {
    const response = await apiClient.post("/api/cart/items", {
      product_id: productId,
      quantity,
    });
    return response.data;
  },

  updateItem: async (productId, quantity) => {
    const response = await apiClient.put(`/api/cart/items/${productId}`, {
      product_id: productId,
      quantity,
    });
    return response.data;
  },

  clearCart: async () => {
    const response = await apiClient.delete("/api/cart");
    return response.data;
  },
};

// Checkout API
export const checkoutAPI = {
  createCheckout: async () => {
    const response = await apiClient.post("/api/checkout");
    return response.data;
  },

  createPayment: async (orderId, currency = "SOL") => {
    const response = await apiClient.post(`/api/checkout/${orderId}/pay`, {
      currency,
    });
    return response.data;
  },

  checkPaymentStatus: async (orderId) => {
    const response = await apiClient.get(`/api/checkout/${orderId}/status`);
    return response.data;
  },

  getOrders: async (params = { skip: 0, limit: 10 }) => {
    const response = await apiClient.get("/api/orders", { params });
    return response.data;
  },

  getOrderById: async (orderId) => {
    const response = await apiClient.get(`/api/orders/${orderId}`);
    return response.data;
  },
};

// Preferences API
export const preferencesAPI = {
  createPreferences: async (preferences) => {
    const response = await apiClient.post("/api/preferences", preferences);
    return response.data;
  },

  getMyPreferences: async () => {
    const response = await apiClient.get("/api/preferences/me");
    return response.data;
  },

  updateMyPreferences: async (updates) => {
    const response = await apiClient.put("/api/preferences/me", updates);
    return response.data;
  },
};

// Recommendations API
export const recommendationsAPI = {
  getRecommendations: async (limit = 2) => {
    const response = await apiClient.get("/api/recommendations", {
      params: { limit },
    });
    return response.data;
  },
};

// Admin APIs
export const adminAPI = {
  // Users management
  getAllUsers: async (skip = 0, limit = 10) => {
    const response = await apiClient.get("/auth/users", {
      params: { skip, limit },
    });
    return response.data;
  },

  // Products management
  createProduct: async (productData) => {
    const response = await apiClient.post("/api/products", productData);
    return response.data;
  },

  updateProduct: async (productId, productData) => {
    const response = await apiClient.put(
      `/api/products/${productId}`,
      productData
    );
    return response.data;
  },

  deleteProduct: async (productId) => {
    const response = await apiClient.delete(`/api/products/${productId}`);
    return response.data;
  },

  // Preferences management
  getAllPreferences: async (skip = 0, limit = 10) => {
    const response = await apiClient.get("/api/preferences", {
      params: { skip, limit },
    });
    return response.data;
  },

  getUserPreferences: async (userEmail) => {
    const response = await apiClient.get(`/api/preferences/${userEmail}`);
    return response.data;
  },

  updateUserPreferences: async (userEmail, updates) => {
    const response = await apiClient.put(
      `/api/preferences/${userEmail}`,
      updates
    );
    return response.data;
  },

  deleteUserPreferences: async (userEmail) => {
    const response = await apiClient.delete(`/api/preferences/${userEmail}`);
    return response.data;
  },
};

export default apiClient;
