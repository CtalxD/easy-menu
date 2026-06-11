// admin/app/dashboard/page.tsx
"use client";

import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Shield, LogOut, Clock, CheckCircle, XCircle, RefreshCw, Users, CreditCard, Store, Mail, Calendar, Search, Phone, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import "./dashboard.css";

interface Subscription {
  id: string;
  plan: string;
  price: number;
  billingCycle: string;
  paymentStatus: string;
  startDate: string;
  endDate: string;
  purchasedAt: string;
  restaurant: {
    owner: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface Restaurant {
  id: string;
  name: string;
  plan: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  admin: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    restaurants: number;
  };
  restaurants: Restaurant[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"subscriptions" | "users">("subscriptions");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");

    if (!token || !user) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(user);
    if (!parsedUser.admin) {
      router.push("/login");
      return;
    }

    setAdminUser(parsedUser);
    fetchPendingSubscriptions(token);
    fetchAllUsers(token);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.restaurants && user.restaurants.some(
            (r) =>
              r.name.toLowerCase().includes(query) ||
              (r.phone && r.phone.includes(query)) ||
              (r.address && r.address.toLowerCase().includes(query))
          ))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchPendingSubscriptions = async (token: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${API_URL}/api/admin/subscriptions/pending`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch subscriptions");
      }

      const data = await response.json();
      setSubscriptions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async (token: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${API_URL}/api/admin/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      console.error("Failed to load users:", err);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${API_URL}/api/admin/users?search=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFilteredUsers(data);
      }
    } catch (err: any) {
      console.error("Failed to search users:", err);
    }
  };

  const toggleUserExpand = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const handleApprove = async (subscriptionId: string) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setProcessingId(subscriptionId);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${API_URL}/api/admin/subscriptions/${subscriptionId}/approve`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve subscription");
      }

      setSubscriptions(subscriptions.filter((s) => s.id !== subscriptionId));
    } catch (err: any) {
      setError(err.message || "Approval failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (subscriptionId: string) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setProcessingId(subscriptionId);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${API_URL}/api/admin/subscriptions/${subscriptionId}/reject`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject subscription");
      }

      setSubscriptions(subscriptions.filter((s) => s.id !== subscriptionId));
    } catch (err: any) {
      setError(err.message || "Rejection failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminRestaurantId");
    localStorage.removeItem("adminRestaurantName");
    router.push("/login");
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <RefreshCw className="spin-icon" size={32} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Shield size={24} />
          </div>
          <h2>EasyMenu Admin</h2>
        </div>

        <nav className="sidebar-nav">
          <a 
            href="#" 
            className={`nav-item ${activeTab === "subscriptions" ? "active" : ""}`}
            onClick={(e) => { e.preventDefault(); setActiveTab("subscriptions"); }}
          >
            <CreditCard size={20} />
            <span>Subscriptions</span>
          </a>
          <a 
            href="#" 
            className={`nav-item ${activeTab === "users" ? "active" : ""}`}
            onClick={(e) => { e.preventDefault(); setActiveTab("users"); }}
          >
            <Users size={20} />
            <span>Users</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <span className="admin-name">{adminUser?.name}</span>
            <span className="admin-email">{adminUser?.email}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {activeTab === "subscriptions" ? (
          <>
            <header className="admin-header">
              <h1>Pending Subscriptions</h1>
              <button 
                onClick={() => fetchPendingSubscriptions(localStorage.getItem("adminToken")!)}
                className="refresh-btn"
              >
                <RefreshCw size={18} />
                <span>Refresh</span>
              </button>
            </header>

            {error && (
              <div className="admin-error">
                <span>{error}</span>
                <button onClick={() => setError("")}>&times;</button>
              </div>
            )}

            <div className="subscriptions-grid">
              {subscriptions.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle size={48} />
                  <h3>All caught up!</h3>
                  <p>No pending subscription requests</p>
                </div>
              ) : (
                subscriptions.map((sub) => (
                  <div key={sub.id} className="subscription-card">
                    <div className="card-header">
                      <div className={`plan-badge plan-${sub.plan.toLowerCase()}`}>
                        {sub.plan}
                      </div>
                      <span className="price">
                        ${sub.price}/{sub.billingCycle.toLowerCase()}
                      </span>
                    </div>

                    <div className="card-body">
                      <div className="info-row">
                        <span className="label">Owner</span>
                        <span className="value">{sub.restaurant?.owner?.name || "N/A"}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Email</span>
                        <span className="value">{sub.restaurant?.owner?.email || "N/A"}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Purchased</span>
                        <span className="value">
                          {new Date(sub.purchasedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        onClick={() => handleApprove(sub.id)}
                        disabled={processingId === sub.id}
                        className="approve-btn"
                      >
                        <CheckCircle size={18} />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(sub.id)}
                        disabled={processingId === sub.id}
                        className="reject-btn"
                      >
                        <XCircle size={18} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <header className="admin-header">
              <h1>All Users ({filteredUsers.length})</h1>
              <div className="header-actions">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search by name, email, restaurant or phone..."
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => fetchAllUsers(localStorage.getItem("adminToken")!)}
                  className="refresh-btn"
                >
                  <RefreshCw size={18} />
                  <span>Refresh</span>
                </button>
              </div>
            </header>

            <div className="users-table-container">
              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <Search size={48} />
                  <h3>No users found</h3>
                  <p>{searchQuery ? "Try a different search term" : "Users will appear here once they register"}</p>
                </div>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Verified</th>
                      <th>Restaurants</th>
                      <th>Joined</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <Fragment key={user.id}>
                        <tr className={expandedUser === user.id ? "expanded-row" : ""}>
                          <td>
                            <div className="user-name-cell">
                              <div className="user-avatar" style={{ 
                                background: user.admin ? '#F59E0B' : 'var(--accent)'
                              }}>
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="user-display-name">{user.name}</div>
                                <div className="user-id-label">
                                  ID: {user.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="email-cell">
                              <Mail size={14} />
                              {user.email}
                            </div>
                          </td>
                          <td>
                            <span className={`role-badge ${user.admin ? "admin" : "user"}`}>
                              {user.admin ? "Admin" : "User"}
                            </span>
                          </td>
                          <td>
                            <div className="verified-cell">
                              {user.verified ? (
                                <>
                                  <CheckCircle size={16} className="verified-icon" />
                                  <span className="verified-text">Verified</span>
                                </>
                              ) : (
                                <>
                                  <Clock size={16} className="pending-icon" />
                                  <span className="pending-text">Pending</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="restaurant-count-cell">
                              <Store size={14} />
                              <span>{user._count?.restaurants || (user.restaurants ? user.restaurants.length : 0)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="date-cell">
                              <Calendar size={14} />
                              {formatDate(user.createdAt)}
                            </div>
                          </td>
                          <td>
                            {user.restaurants && user.restaurants.length > 0 && (
                              <button
                                onClick={() => toggleUserExpand(user.id)}
                                className="expand-btn"
                              >
                                {expandedUser === user.id ? (
                                  <ChevronUp size={18} />
                                ) : (
                                  <ChevronDown size={18} />
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedUser === user.id && user.restaurants && user.restaurants.length > 0 && (
                          <tr key={`${user.id}-restaurants`} className="restaurant-details-row">
                            <td colSpan={7}>
                              <div className="restaurant-details">
                                <h4>Restaurants ({user.restaurants.length})</h4>
                                <div className="restaurant-list">
                                  {user.restaurants.map((restaurant) => (
                                    <div key={restaurant.id} className="restaurant-mini-card">
                                      <div className="restaurant-mini-header">
                                        <Store size={16} />
                                        <span className="restaurant-mini-name">{restaurant.name}</span>
                                        <span className={`plan-badge plan-${restaurant.plan.toLowerCase()}`}>
                                          {restaurant.plan}
                                        </span>
                                      </div>
                                      <div className="restaurant-mini-body">
                                        {restaurant.phone && (
                                          <div className="restaurant-mini-item">
                                            <Phone size={14} />
                                            <span>{restaurant.phone}</span>
                                          </div>
                                        )}
                                        {restaurant.address && (
                                          <div className="restaurant-mini-item">
                                            <MapPin size={14} />
                                            <span>{restaurant.address}</span>
                                          </div>
                                        )}
                                        <div className="restaurant-mini-item">
                                          <Calendar size={14} />
                                          <span>Created: {formatDate(restaurant.createdAt)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}