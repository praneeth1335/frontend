import React, { useState, useEffect } from "react";
import { transactionsAPI } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";

const TransactionHistory = ({ friendId, friendName, onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (friendId) {
      loadTransactionHistory();
    }
  }, [friendId, currentPage]);

  const loadTransactionHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await transactionsAPI.getTransactionHistory(friendId, {
        page: currentPage,
        limit: 10,
      });

      if (response.data && response.data.success) {
        setTransactions(response.data.data.transactions || []);
        setPagination(response.data.data.pagination || {});
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load transaction history"
      );
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatAmount = (amount) => {
    const num = parseFloat(amount) || 0;
    return `$${num.toFixed(2)}`;
  };

  const getTransactionIcon = (transaction) => {
    if (transaction.type === "expense") {
      return transaction.paidBy === "user" ? "💳" : "🧾";
    } else if (transaction.type === "settlement") {
      return transaction.settledBy === "user" ? "💰" : "🤝";
    }
    return "📄";
  };

  const getTransactionColor = (transaction) => {
    if (transaction.type === "expense") {
      return transaction.paidBy === "user"
        ? "expense-paid-by-user"
        : "expense-paid-by-friend";
    } else if (transaction.type === "settlement") {
      return "settlement";
    }
    return "";
  };

  const handleClose = () => {
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (loading) {
    return (
      <div className="transaction-history-overlay" onClick={handleOverlayClick}>
        <div className="transaction-history-modal">
          <div className="transaction-history-header">
            <h2>📊 Transaction History with {friendName}</h2>
            <button className="modal-close-button" onClick={handleClose}>
              ✕
            </button>
          </div>
          <div className="transaction-history-content">
            <LoadingSpinner message="Loading transaction history..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-history-overlay" onClick={handleOverlayClick}>
      <div className="transaction-history-modal">
        <div className="transaction-history-header">
          <h2>📊 Transaction History with {friendName}</h2>
          <button className="modal-close-button" onClick={handleClose}>
            ✕
          </button>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="transaction-history-content">
          {transactions.length === 0 ? (
            <div className="no-transactions">
              <p>📝 No transactions found with {friendName}</p>
              <p>Start splitting bills to see your transaction history!</p>
            </div>
          ) : (
            <>
              <div className="transactions-list-container">
                <div className="transactions-list">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className={`transaction-item ${getTransactionColor(
                        transaction
                      )}`}
                    >
                      <div className="transaction-icon">
                        {getTransactionIcon(transaction)}
                      </div>

                      <div className="transaction-details">
                        <div className="transaction-description">
                          {transaction.description || "Bill Split"}
                        </div>
                        <div className="transaction-date">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </div>

                      <div className="transaction-amounts">
                        {transaction.type === "expense" ? (
                          <>
                            <div className="transaction-total">
                              Total: {formatAmount(transaction.billTotal)}
                            </div>
                            <div className="transaction-split">
                              Your Expense:{" "}
                              {formatAmount(transaction.userExpense)}
                              <br />
                              {friendName}'s Expense:{" "}
                              {formatAmount(transaction.friendExpense)}
                            </div>
                            <h3
                              className="transaction-paid-by"
                              style={{ color: "blue" }}
                            >
                              Paid by:{" "}
                              {transaction.paidBy === "user"
                                ? "You"
                                : friendName}
                            </h3>
                          </>
                        ) : (
                          <>
                            <div className="transaction-settlement">
                              Settlement: {formatAmount(transaction.amount)}
                            </div>
                            <div className="transaction-settled-by">
                              Settled by:{" "}
                              {transaction.settledBy === "user"
                                ? "You"
                                : friendName}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="transaction-balance">
                        Balance: {formatAmount(transaction.balanceAfter || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                  >
                    ← Previous
                  </button>

                  <span className="pagination-info">
                    Page {pagination.page || currentPage} of{" "}
                    {pagination.pages || 1}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.pages}
                    className="pagination-button"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
