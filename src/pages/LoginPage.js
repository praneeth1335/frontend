import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [shouldBlink, setShouldBlink] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Theme initialization - retrieve from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setDarkMode(savedTheme === "dark");
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      // Default to light theme if no theme is saved
      document.documentElement.setAttribute("data-theme", "light");
      setDarkMode(false);
    }
  }, []);

  // Handle error display with persistence
  useEffect(() => {
    if (error) {
      setLocalError(error);
      setShouldBlink(true);

      // Clear the blink effect after 3 seconds but keep the error message
      const blinkTimer = setTimeout(() => setShouldBlink(false), 3000);

      // Clear the error message after 10 seconds to give user time to read
      const errorTimer = setTimeout(() => {
        setLocalError(null);
        clearError();
      }, 10000);

      return () => {
        clearTimeout(blinkTimer);
        clearTimeout(errorTimer);
      };
    }
  }, [error, clearError]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    // Clear local error when user starts typing
    if (localError) {
      setLocalError(null);
      clearError();
    }
  };

  // LoginPage.js
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting || loading) {
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      const result = await login(formData);

      if (result.success) {
        // Only navigate on successful login
        navigate("/dashboard");
      } else {
        // Login failed - error will be handled by useEffect
        // Don't navigate or refresh, just show the error
        console.log("Login failed:", result.error);
      }
    } catch (error) {
      console.error("Login submission error:", error);
      setLocalError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display error from either local state or auth context
  const displayError = localError || error;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Quantify</h1> {/* Changed from "SplitWise Pro" to "Quantify" */}
          <h2>Welcome Back</h2>
          <p>Sign in to continue managing your expenses.</p>
        </div>
        <div className="auth-form">
          {displayError && (
            <div className={`error-message ${shouldBlink ? "blink" : ""}`}>
              <span className="error-icon">⚠️</span> {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                disabled={isSubmitting || loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  disabled={isSubmitting || loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || loading}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="auth-links">
            <p>
              <Link
                to="/forgot-password"
                className={`forgot-password-link ${shouldBlink ? "blink" : ""}`}
              >
                Forgot your password?
              </Link>
            </p>
            <p>
              Don't have an account? <Link to="/register">Create Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
