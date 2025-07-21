import React from "react";
import { Link } from "react-router-dom";
import "./forgotPasswordPage.css";

const ForgotPasswordPage = () => {
  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          {/* Brand Section */}
          <div className="brand-section">
            <h1 className="brand-logo">Quantify</h1>
            <h2 className="brand-title">Coming Soon</h2>
            <p className="brand-subtitle">
              We're working hard to bring this feature to you!
            </p>
          </div>

          {/* Form Section */}
          <div className="form-section">
            <div className="brand-header">
              <h1 className="brand-logo">Quantify</h1>
            </div>

            <div className="page-header">
              <h2 className="page-title">Forgot Password</h2>
              <p className="page-subtitle">
                This feature is currently unavailable. We apologize for the
                inconvenience.
              </p>
            </div>

            <div className="message error-message">
              <span className="message-icon">🚧</span>
              <span className="message-text">
                Password reset functionality will be available soon. Thank you
                for your patience!
              </span>
            </div>

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
