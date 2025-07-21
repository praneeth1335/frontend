import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import "./forgotPasswordPage.css";

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Initialize theme from localStorage (similar to App.js)
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear errors when user starts typing
    if (localError) setLocalError("");
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLocalError("");
    setLocalLoading(true);

    try {
      const response = await authAPI.forgotPassword(formData.email);

      if (response.data && response.data.success) {
        setSuccessMessage("OTP sent to your email successfully!");
        setStep(2);
      } else {
        setLocalError(response.data?.message || "Failed to send OTP");
      }
    } catch (error) {
      setLocalError(
        error.response?.data?.message || "Network error. Please try again."
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLocalError("");
    setLocalLoading(true);

    try {
      const response = await authAPI.verifyOTP({
        email: formData.email,
        otp: formData.otp,
      });

      if (response.data && response.data.success) {
        setSuccessMessage("OTP verified successfully!");
        setStep(3);
      } else {
        setLocalError(response.data?.message || "Invalid OTP");
      }
    } catch (error) {
      setLocalError(
        error.response?.data?.message || "Network error. Please try again."
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLocalError("");

    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      setLocalError("Password must be at least 6 characters long");
      return;
    }

    setLocalLoading(true);

    try {
      const response = await authAPI.resetPassword({
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });

      if (response.data && response.data.success) {
        setSuccessMessage(
          "Password reset successfully! Redirecting to login..."
        );
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setLocalError(response.data?.message || "Failed to reset password");
      }
    } catch (error) {
      setLocalError(
        error.response?.data?.message || "Network error. Please try again."
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleSendOTP} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email address"
                  className="form-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={localLoading}
              className="forgot-password-button primary"
            >
              {localLoading ? (
                <>
                  <span className="button-spinner"></span>
                  Sending OTP...
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleVerifyOTP} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <div className="input-wrapper">
                <span className="input-icon">🔢</span>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  required
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  className="form-input"
                />
              </div>
              <p className="form-help-text">OTP sent to: {formData.email}</p>
            </div>

            <button
              type="submit"
              disabled={localLoading}
              className="forgot-password-button primary"
            >
              {localLoading ? (
                <>
                  <span className="button-spinner"></span>
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="forgot-password-button secondary"
            >
              Change Email
            </button>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleResetPassword} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  placeholder="Enter new password"
                  className="form-input"
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm new password"
                  className="form-input"
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={localLoading}
              className="forgot-password-button primary"
            >
              {localLoading ? (
                <>
                  <span className="button-spinner"></span>
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Forgot Password";
      case 2:
        return "Verify OTP";
      case 3:
        return "Reset Password";
      default:
        return "Forgot Password";
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1:
        return "Enter your email to receive an OTP";
      case 2:
        return "Enter the OTP sent to your email";
      case 3:
        return "Create a new password";
      default:
        return "";
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          {/* Desktop Brand Section (Left Panel) */}
          <div className="brand-section">
            <h1 className="brand-logo">Quantify</h1>
            <h2 className="brand-title">Welcome Back</h2>
            <p className="brand-subtitle">
              Change your password fast and Sign in!
            </p>
          </div>

          {/* Form Section (Right Panel on Desktop, Full on Mobile) */}
          <div className="form-section">
            {/* Mobile Brand Header */}
            <div className="brand-header">
              <h1 className="brand-logo">Quantify</h1>
            </div>

            {/* Mobile Page Header */}
            <div className="page-header">
              <h2 className="page-title">{getStepTitle()}</h2>
              <p className="page-subtitle">{getStepSubtitle()}</p>
            </div>

            {/* Progress indicator */}
            <div className="progress-indicator">
              <div className="progress-line">
                <div
                  className="progress-fill"
                  style={{ width: `${((step - 1) / 2) * 100}%` }}
                ></div>
              </div>
              <div className="progress-steps">
                <div className={`progress-step ${step >= 1 ? "active" : ""}`}>
                  <div className="step-circle">
                    <span className="step-number">1</span>
                  </div>
                  <span className="step-label">EMAIL</span>
                </div>
                <div className={`progress-step ${step >= 2 ? "active" : ""}`}>
                  <div className="step-circle">
                    <span className="step-number">2</span>
                  </div>
                  <span className="step-label">OTP</span>
                </div>
                <div className={`progress-step ${step >= 3 ? "active" : ""}`}>
                  <div className="step-circle">
                    <span className="step-number">3</span>
                  </div>
                  <span className="step-label">RESET</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            {successMessage && (
              <div className="message success-message">
                <span className="message-icon">✅</span>
                <span className="message-text">{successMessage}</span>
              </div>
            )}

            {localError && (
              <div className="message error-message">
                <span className="message-icon">⚠️</span>
                <span className="message-text">{localError}</span>
              </div>
            )}

            {/* Form Content */}
            <div className="form-content">{renderStepContent()}</div>

            {/* Footer Links */}
            <div className="page-footer">
              <Link to="/login" className="back-link">
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
