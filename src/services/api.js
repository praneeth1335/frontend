import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (userData) => api.put("/auth/profile", userData),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  verifyOTP: (data) => api.post("/auth/verify-otp", data),
  resetPassword: (resetData) => api.post("/auth/reset-password", resetData),
};

// Friends API
export const friendsAPI = {
  getFriends: () => api.get("/friends"),
  getFriend: (id) => api.get(`/friends/${id}`),
  addFriend: (friendData) => api.post("/friends", friendData),
  updateFriend: (id, friendData) => api.put(`/friends/${id}`, friendData),
  deleteFriend: (id) => api.delete(`/friends/${id}`),
  addTransaction: (friendId, transactionData) =>
    api.post(`/friends/${friendId}/transactions`, transactionData),
  settleBalance: (friendId, settlementData) =>
    api.post(`/friends/${friendId}/settle`, settlementData),
};

// Transactions API
export const transactionsAPI = {
  getAllTransactions: (params = {}) => api.get("/transactions", { params }),
  getTransaction: (id) => api.get(`/transactions/${id}`),
  getTransactionHistory: (friendId, params = {}) =>
    api.get(`/transactions/friend/${friendId}`, { params }),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
  getTransactionStats: () => api.get("/transactions/stats"),
};

// Email API
export const emailAPI = {
  sendEmail: (emailData) => api.post("email/send", emailData),
};

export default api;
