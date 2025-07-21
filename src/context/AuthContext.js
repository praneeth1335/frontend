import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          // Verify token is still valid by fetching profile
          const response = await authAPI.getProfile();
          if (response.data && response.data.success) {
            setUser(response.data.data.user);
          } else {
            throw new Error("Invalid profile response");
          }
        } catch (error) {
          console.error("Token validation failed:", error);
          // Token is invalid, clear storage
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // AuthContext.js
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Attempting login with:", { email: credentials.email });

      const response = await authAPI.login(credentials);

      if (response.data && response.data.success) {
        const { token, user } = response.data.data;

        // Store token and user data
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);

        console.log("Login successful for user:", user.name);
        return { success: true };
      } else {
        const errorMessage = response.data?.message || "Login failed";
        console.log("Login failed:", errorMessage);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error("Login error:", error);

      let errorMessage = "Login failed";

      if (error.response) {
        // Server responded with error status
        errorMessage =
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage =
          "Unable to connect to server. Please check your internet connection.";
      } else {
        // Something else happened
        errorMessage = error.message || "An unexpected error occurred";
      }

      console.log("Setting error message:", errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Attempting registration for:", userData.email);

      const response = await authAPI.register(userData);

      if (response.data && response.data.success) {
        const { token, user } = response.data.data;

        // Store token and user data
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);

        console.log("Registration successful for user:", user.name);
        return { success: true };
      } else {
        const errorMessage = response.data?.message || "Registration failed";
        console.log("Registration failed:", errorMessage);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error("Registration error:", error);

      let errorMessage = "Registration failed";

      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage =
          "Unable to connect to server. Please check your internet connection.";
      } else {
        errorMessage = error.message || "An unexpected error occurred";
      }

      console.log("Setting registration error:", errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out user...");
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear storage and state regardless of API call result
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setError(null);
      console.log("User logged out successfully");
    }
  };

  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.updateProfile(userData);

      if (response.data && response.data.success) {
        const updatedUser = response.data.data.user;

        // Update stored user data
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        return { success: true };
      } else {
        throw new Error(response.data?.message || "Profile update failed");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Profile update failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);

      await authAPI.forgotPassword(email);
      return { success: true };
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to send reset email";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (resetData) => {
    try {
      setLoading(true);
      setError(null);

      await authAPI.resetPassword(resetData);
      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Password reset failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fixed refreshUserData function with better error handling
  const refreshUserData = async () => {
    try {
      console.log("Refreshing user data...");
      const response = await authAPI.getProfile();

      if (response.data && response.data.success) {
        const updatedUser = response.data.data.user;

        // Update stored user data
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        console.log("User data refreshed successfully:", updatedUser);
        return { success: true, user: updatedUser };
      } else {
        throw new Error(response.data?.message || "Invalid profile response");
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);

      // Don't clear user data on refresh failure, just log the error
      // This prevents the user from being logged out due to temporary network issues
      return { success: false, error: error.message };
    }
  };

  // Clear error function - important for preventing premature refresh
  const clearError = () => {
    console.log("Clearing error state");
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    forgotPassword,
    resetPassword,
    refreshUserData,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
