import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { friendsAPI, emailAPI } from "./services/api";

// Import components
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LoadingSpinner from "./components/LoadingSpinner";
import TransactionHistory from "./components/TransactionHistory";
import ConfirmationPopup from "./components/ConfirmationPopup";

// Main App component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

// Routes component
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          !isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />
        }
      />
      <Route
        path="/register"
        element={
          !isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />
        }
      />
      <Route
        path="/forgot-password"
        element={
          !isAuthenticated ? (
            <ForgotPasswordPage />
          ) : (
            <Navigate to="/dashboard" />
          )
        }
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />}
      />
    </Routes>
  );
}

// Enhanced Bill Split Manager Component (for dashboard)
export function EatSplit() {
  const authContext = useAuth();
  const { user, logout, refreshUserData } = authContext;

  const [friends, setFriends] = useState([]);
  const [showAddFriend, setShowFriend] = useState(false);
  const [selectedId, setSelectedId] = useState(0);
  const [news, setNews] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedFriendForHistory, setSelectedFriendForHistory] =
    useState(null);

  // Confirmation popup states
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState(null);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setDarkMode(savedTheme === "dark");
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  // Load friends from backend
  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading friends...");
      const response = await friendsAPI.getFriends();
      console.log("Friends response:", response);

      if (response.data && response.data.success) {
        const friendsData = response.data.data.friends || [];
        setFriends(friendsData);
        console.log("Friends loaded successfully:", friendsData.length);

        // Always refresh user data to get updated balances after loading friends
        try {
          const refreshResult = await refreshUserData();
          if (refreshResult && !refreshResult.success) {
            console.warn("Failed to refresh user data:", refreshResult.error);
          }
        } catch (refreshError) {
          console.error("Error refreshing user data:", refreshError);
        }
      } else {
        throw new Error(response.data?.message || "Invalid response format");
      }
    } catch (error) {
      console.error("Error loading friends:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load friends";
      setError(errorMessage);
      setFriends([]);

      // Even on error, try to refresh user data to ensure balances are correct
      try {
        const refreshResult = await refreshUserData();
        if (refreshResult && !refreshResult.success) {
          console.warn(
            "Failed to refresh user data after error:",
            refreshResult.error
          );
        }
      } catch (refreshError) {
        console.error("Error refreshing user data after error:", refreshError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = darkMode ? "light" : "dark";
    setDarkMode(!darkMode);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  function handleShowAddFriend() {
    setShowFriend((x) => !x);
  }

  const handleAdd = async ({ name, url, email }) => {
    try {
      setError(null);

      const friendData = {
        name,
        email,
        ...(url && url.trim() && { avatar: url }),
      };

      console.log("Adding friend:", friendData);
      const response = await friendsAPI.addFriend(friendData);
      console.log("Add friend response:", response);

      if (response.data && response.data.success) {
        const newFriend = response.data.data.friend;
        setFriends((prev) => [...prev, newFriend]);
        setShowFriend(false);

        // Refresh user data after adding friend
        try {
          const refreshResult = await refreshUserData();
          if (refreshResult && !refreshResult.success) {
            console.warn(
              "Failed to refresh user data after adding friend:",
              refreshResult.error
            );
          }
        } catch (refreshError) {
          console.error(
            "Error refreshing user data after adding friend:",
            refreshError
          );
        }

        console.log("Friend added successfully:", newFriend.name);
      } else {
        throw new Error(response.data?.message || "Failed to add friend");
      }
    } catch (error) {
      console.error("Error adding friend:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error adding friend. Please try again.";
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  function handleSelect(id) {
    setNews((x) => !x);
    setSelectedId(id);
  }

  const handleList = async ({
    selectedId,
    friendExpense,
    yourExpense,
    whoPays,
    description,
  }) => {
    try {
      setError(null);

      const transactionData = {
        billTotal: friendExpense + yourExpense,
        userExpense: yourExpense,
        friendExpense: friendExpense,
        paidBy: whoPays,
        description:
          description || `Bill split - ${new Date().toLocaleDateString()}`,
      };

      console.log("Adding transaction:", transactionData);
      const response = await friendsAPI.addTransaction(
        selectedId,
        transactionData
      );
      console.log("Transaction response:", response);

      if (response.data && response.data.success) {
        // Reload friends to get updated balances
        await loadFriends(); // This will also trigger refreshUserData
        setSelectedId(0);
        setNews(false);
        console.log("Transaction added successfully");
      } else {
        throw new Error(response.data?.message || "Failed to add transaction");
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error adding transaction. Please try again.";
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const handleDeleteFriend = (id) => {
    const friend = friends.find((f) => f._id === id);
    if (!friend) return;

    if (Math.abs(friend.balance || 0) > 0.01) {
      alert(
        `Cannot delete ${friend.name}. You must settle all balances first.`
      );
      return;
    }

    // Show custom confirmation popup instead of browser alert
    setFriendToDelete(friend);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteFriend = async () => {
    if (!friendToDelete) return;

    try {
      setError(null);

      console.log("Deleting friend:", friendToDelete._id);
      const response = await friendsAPI.deleteFriend(friendToDelete._id);
      console.log("Delete response:", response);

      if (response.data && response.data.success) {
        setFriends((prev) => prev.filter((f) => f._id !== friendToDelete._id));
        if (selectedId === friendToDelete._id) {
          setSelectedId(0);
        }

        // Refresh user data after deleting friend
        try {
          const refreshResult = await refreshUserData();
          if (refreshResult && !refreshResult.success) {
            console.warn(
              "Failed to refresh user data after deleting friend:",
              refreshResult.error
            );
          }
        } catch (refreshError) {
          console.error(
            "Error refreshing user data after deleting friend:",
            refreshError
          );
        }

        console.log("Friend deleted successfully");
      } else {
        throw new Error(response.data?.message || "Failed to delete friend");
      }
    } catch (error) {
      console.error("Error deleting friend:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error deleting friend. Please try again.";
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      // Close confirmation popup
      setShowDeleteConfirmation(false);
      setFriendToDelete(null);
    }
  };

  const cancelDeleteFriend = () => {
    setShowDeleteConfirmation(false);
    setFriendToDelete(null);
  };

  const handleViewTransactionHistory = (friend) => {
    console.log("Viewing transaction history for:", friend);
    setSelectedFriendForHistory(friend);
    setShowTransactionHistory(true);
  };

  const handleCloseTransactionHistory = () => {
    setShowTransactionHistory(false);
    setSelectedFriendForHistory(null);
    // Reload friends to get updated balances after viewing history
    // loadFriends(); // This will also trigger refreshUserData
  };

  const handleMailFriend = async (friend) => {
    try {
      setError(null);

      const balance = friend.balance || 0;
      let subject = "";
      let message = "";

      if (balance > 0) {
        subject = `Qunatify Reminder - You owe $${balance.toFixed(2)}`;
        message = `Hi ${friend.name},

Just a friendly reminder that you owe me $${balance.toFixed(
          2
        )} from our recent bill split.

Please let me know when you can settle this amount.

Thanks!
Best regards,
${user.name}`;
      } else if (balance < 0) {
        subject = `Qunatify Update - I owe you $${Math.abs(balance).toFixed(
          2
        )}`;
        message = `Hi ${friend.name},

I owe you $${Math.abs(balance).toFixed(2)} from our recent bill split.

Let me know how you'd like me to pay you back.

Thanks!
Best regards,
${user.name}`;
      } else {
        subject = `Qunatify Update - We're all settled up!`;
        message = `Hi ${friend.name},

Great news! We're all settled up on our bill splits.

Thanks for being awesome to split bills with!

Best regards,
${user.name}`;
      }

      console.log("Sending email to:", friend.email);

      const emailData = {
        to: friend.email,
        subject: subject,
        message: message,
      };

      const response = await emailAPI.sendEmail(emailData);
      console.log("Email response:", response);

      if (response.data && response.data.success) {
        alert(`Email sent successfully to ${friend.name}!`);
      } else {
        throw new Error(response.data?.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to send email. Please try again.";
      setError(errorMessage);
      alert(`Failed to send email to ${friend.name}: ${errorMessage}`);
    }
  };

  const handleContactUs = () => {
    alert("Contact us at: bspraneeth05@gmail.com\nPhone: +91 8712135034");
  };

  // Show logout confirmation popup instead of browser confirm
  const handleLogout = () => {
    setShowLogoutConfirmation(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirmation(false);
    await logout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  // Calculate analytics directly from the user object from AuthContext
  // These values will automatically update when the `user` object changes
  const totalOwedToYou = user?.totalOwedToYou || 0;
  const totalYouOwe = user?.totalYouOwe || 0;
  const netBalance = user?.netBalance || 0;
  const totalFriends = friends.length;

  if (loading) {
    return <LoadingSpinner message="Loading your friends..." />;
  }

  return (
    <>
      {/* Header */}
      <header className="header">
        <h1 className="header-title">Quantify</h1>
        <nav className="header-nav">
          <span className="user-greeting">Hello, {user?.name}!</span>
          <a href="#" onClick={handleContactUs}>
            Contact Us
          </a>
          <button className="theme-toggle" onClick={toggleTheme}>
            {darkMode ? "Light" : "Dark"}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      {/* Main Container */}
      <div className="main-container">
        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="error-close">
              ✕
            </button>
          </div>
        )}

        {/* Visual Analytics Section */}
        <section className="analytics-section">
          <h2 className="analytics-title">Financial Overview</h2>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>Total Owed to You</h3>
              <div
                className={`analytics-value ${
                  totalOwedToYou > 0 ? "positive" : "neutral"
                }`}
              >
                ${totalOwedToYou.toFixed(2)}
              </div>
              <p className="analytics-description">Money friends owe you</p>
            </div>

            <div className="analytics-card">
              <h3>Total You Owe</h3>
              <div
                className={`analytics-value ${
                  totalYouOwe > 0 ? "negative" : "neutral"
                }`}
              >
                ${totalYouOwe.toFixed(2)}
              </div>
              <p className="analytics-description">Money you owe friends</p>
            </div>

            <div className="analytics-card">
              <h3>Net Balance</h3>
              <div
                className={`analytics-value ${
                  netBalance > 0
                    ? "positive"
                    : netBalance < 0
                    ? "negative"
                    : "neutral"
                }`}
              >
                ${netBalance.toFixed(2)}
              </div>
              <p className="analytics-description">
                {netBalance > 0
                  ? "You are owed overall"
                  : netBalance < 0
                  ? "You owe overall"
                  : "All settled up!"}
              </p>
            </div>

            <div className="analytics-card">
              <h3>Total Friends</h3>
              <div className="analytics-value neutral">{totalFriends}</div>
              <p className="analytics-description">Friends in your network</p>
            </div>
          </div>
        </section>

        {/* Main App */}
        <div className="app">
          <div className="sidebar">
            <FriendsList
              friendArray={friends}
              onSelect={handleSelect}
              onDelete={handleDeleteFriend}
              onMail={handleMailFriend}
              onViewHistory={handleViewTransactionHistory}
            />
            {showAddFriend ? <FormAddFriend onAdd={handleAdd} /> : ""}
            <Button onClick={handleShowAddFriend}>
              {showAddFriend ? "Close" : "Add Friend"}
            </Button>
          </div>
          <FormSplitBill
            selectedId={selectedId}
            friends={friends}
            news={news}
            onForm={handleList}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>
          Developed by <strong>Bodapati Sai Praneeth</strong> | © 2024 Quantify
        </p>
      </footer>

      {/* Transaction History Modal */}
      {showTransactionHistory && selectedFriendForHistory && (
        <TransactionHistory
          friendId={selectedFriendForHistory._id}
          friendName={selectedFriendForHistory.name}
          onClose={handleCloseTransactionHistory}
        />
      )}

      {/* Custom Delete Confirmation Popup */}
      <ConfirmationPopup
        isOpen={showDeleteConfirmation}
        title="🗑️ Delete Friend"
        message={`Are you sure you want to delete ${friendToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteFriend}
        onCancel={cancelDeleteFriend}
        confirmButtonClass="button-danger"
      />

      {/* Custom Logout Confirmation Popup */}
      <ConfirmationPopup
        isOpen={showLogoutConfirmation}
        title="🚪 Logout Confirmation"
        message="Are you sure you want to logout? You will need to login again to access your account."
        confirmText="Logout"
        cancelText="Stay Logged In"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
        confirmButtonClass="button-danger"
      />
    </>
  );
}

// Button component
function Button({ children, onClick, className = "" }) {
  return (
    <button className={`button ${className}`} onClick={onClick}>
      <span>{children}</span>
    </button>
  );
}

// Friends List component
function FriendsList({
  friendArray,
  onSelect,
  onDelete,
  onMail,
  onViewHistory,
}) {
  if (!friendArray || friendArray.length === 0) {
    return (
      <div className="no-friends">
        <p>No friends added yet</p>
        <p>Add your first friend to start splitting bills!</p>
      </div>
    );
  }

  return (
    <ul>
      {friendArray.map((friend) => {
        return (
          <Friend
            friend={friend}
            key={friend._id}
            onSelect={onSelect}
            onDelete={onDelete}
            onMail={onMail}
            onViewHistory={onViewHistory}
          />
        );
      })}
    </ul>
  );
}

// Friend component
function Friend({ friend, onSelect, onDelete, onMail, onViewHistory }) {
  const balance = friend.balance || 0;

  return (
    <li>
      <img src={friend.avatar} alt={friend.name} />
      <h3>{friend.name}</h3>
      {balance < 0 ? (
        <p className="reds">
          You owe {friend.name} ${Math.abs(balance).toFixed(2)}
        </p>
      ) : balance > 0 ? (
        <p className="green">
          {friend.name} owes you ${balance.toFixed(2)}
        </p>
      ) : (
        <p className="neutral">{friend.name} and you are all square!</p>
      )}
      <div className="friend-actions">
        <button className="button" onClick={() => onSelect(friend._id)}>
          <span>Select</span>
        </button>
        <button
          className="button button-info"
          onClick={() => onViewHistory(friend)}
        >
          <span>History</span>
        </button>
        <button
          className="button button-warning"
          onClick={() => onMail(friend)}
          style={{ color: "white" }}
        >
          <span>Send Email</span>
        </button>
        <button
          className={`button ${Math.abs(balance) === 0 ? "button-danger" : ""}`}
          onClick={() => onDelete(friend._id)}
          disabled={Math.abs(balance) > 0.01}
          style={{
            opacity: Math.abs(balance) > 0.01 ? 0.5 : 1,
            cursor: Math.abs(balance) > 0.01 ? "not-allowed" : "pointer",
          }}
        >
          <span>Delete</span>
        </button>
      </div>
    </li>
  );
}

// Add Friend Form component
function FormAddFriend({ onAdd }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email) {
      alert("Please fill in name and email fields.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    // URL validation (only if provided)
    if (url && url.trim() !== "") {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(url)) {
        alert("Please enter a valid URL starting with http:// or https://");
        return;
      }
    }

    onAdd({ name, url: url || "", email });
    setName("");
    setUrl("");
    setEmail("");
  }

  return (
    <form className="form-add-friend" onSubmit={handleSubmit}>
      <label>Friend Name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter friend's name"
        required
      />
      <label>Image URL (Optional)</label>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter image URL (optional)"
      />
      <label>Email Address</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email address"
        required
      />
      <Button>Add Friend</Button>
    </form>
  );
}

// Split Bill Form component
function FormSplitBill({ selectedId, friends, news, onForm }) {
  const friend = friends.find((x) => x._id === selectedId);
  const [billValue, setBillValue] = useState("");
  const [yourExpense, setYourExpense] = useState("");
  const [friendExpense, setFriendExpense] = useState("");
  const [whoPays, setWhoPays] = useState("user");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setBillValue("");
    setYourExpense("");
    setFriendExpense("");
    setDescription("");
  }, [news]);

  if (!friend) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem",
          fontSize: "2rem",
          color: "var(--light-text-color)",
          background: "var(--light-card-bg)",
          borderRadius: "25px",
          border: "1px solid var(--light-card-border)",
          backdropFilter: "blur(20px) brightness(1.1)",
          boxShadow:
            "0 12px 50px var(--light-shadow-color), var(--light-glow-effect)",
        }}
      >
        <h2>Select a friend to split the bill with</h2>
        <p style={{ fontSize: "1.6rem", marginTop: "1rem", opacity: 0.7 }}>
          Choose someone from your friends list to get started!
        </p>
      </div>
    );
  }

  function handleBillValueChange(e) {
    const value = parseFloat(e.target.value) || 0;
    setBillValue(e.target.value);

    // Auto-calculate friend's expense when bill value changes
    if (yourExpense) {
      const yourExp = parseFloat(yourExpense) || 0;
      setFriendExpense((value - yourExp).toFixed(2));
    }
  }

  function handleYourExpenseChange(e) {
    const value = parseFloat(e.target.value) || 0;
    const bill = parseFloat(billValue) || 0;

    setYourExpense(e.target.value);
    setFriendExpense((bill - value).toFixed(2));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const bill = parseFloat(billValue) || 0;
    const yourExp = parseFloat(yourExpense) || 0;
    const friendExp = parseFloat(friendExpense) || 0;

    if (bill <= 0) {
      alert("Please enter a valid bill amount.");
      return;
    }

    if (yourExp < 0 || friendExp < 0) {
      alert("Expenses cannot be negative.");
      return;
    }

    if (Math.abs(yourExp + friendExp - bill) > 0.01) {
      alert("The sum of expenses should equal the bill amount.");
      return;
    }

    onForm({
      selectedId,
      friendExpense: friendExp,
      yourExpense: yourExp,
      whoPays,
      description,
    });

    setBillValue("");
    setYourExpense("");
    setFriendExpense("");
    setDescription("");
  }

  function onChange(event) {
    const selectedPayer = event.target.value;
    setWhoPays(selectedPayer);
  }

  return (
    <form className="form-split-bill" onSubmit={handleSubmit}>
      <h2>
        Split a bill with{" "}
        <span style={{ color: "var(--color-primary)" }}>{friend.name}</span>
      </h2>

      <label>Description (Optional)</label>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g., Dinner at restaurant"
      />

      <label>Bill Value</label>
      <input
        type="number"
        value={billValue}
        onChange={handleBillValueChange}
        placeholder="0.00"
        step="0.01"
        min="0"
        required
      />

      <label>Your Expense</label>
      <input
        type="number"
        value={yourExpense}
        max={billValue}
        onChange={handleYourExpenseChange}
        placeholder="0.00"
        step="0.01"
        min="0"
        required
      />

      <label>{friend.name}'s Expense</label>
      <input
        type="number"
        value={friendExpense}
        readOnly
        placeholder="0.00"
        style={{ backgroundColor: "var(--light-input-bg)", opacity: 0.7 }}
      />

      <label>Who's Paying?</label>
      <select onChange={onChange} value={whoPays}>
        <option value="user">You</option>
        <option value="friend">{friend.name}</option>
      </select>

      <Button>Split Bill</Button>
    </form>
  );
}

export default App;
