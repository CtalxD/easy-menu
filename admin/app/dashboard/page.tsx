// admin/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, LogOut, Clock, CheckCircle, XCircle, RefreshCw, Menu, Users, CreditCard } from "lucide-react";
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

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

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
  }, []);

  const fetchPendingSubscriptions = async (token: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/subscriptions/pending`,
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

  const handleApprove = async (subscriptionId: string) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setProcessingId(subscriptionId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/subscriptions/${subscriptionId}/approve`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve subscription");
      }

      // Remove from list
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/subscriptions/${subscriptionId}/reject`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject subscription");
      }

      // Remove from list
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
          <a href="#" className="nav-item active">
            <CreditCard size={20} />
            <span>Subscriptions</span>
          </a>
          <a href="#" className="nav-item">
            <Users size={20} />
            <span>Users</span>
          </a>
          <a href="#" className="nav-item">
            <Menu size={20} />
            <span>Restaurants</span>
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
                    <span className="label">Restaurant</span>
                    <span className="value">{sub.restaurant?.owner?.name || "N/A"}</span>
                  </div>
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
      </main>
    </div>
  );
}