//admin/app/dashboard/subscriptions/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard, RefreshCw, CheckCircle, XCircle, Mail,
  Calendar, AlertTriangle, Clock, DollarSign, Filter,
  Search, ChevronDown, TrendingUp, TrendingDown,
  Store
} from "lucide-react";
import "./subscriptions.css";

interface Owner {
  id: string;
  name: string;
  email: string;
}

interface Restaurant {
  id: string;
  name: string;
  owner: Owner;
}

interface Subscription {
  id: string;
  plan: string;
  price: number;
  billingCycle: string;
  paymentStatus: string;
  startDate: string;
  endDate: string;
  purchasedAt: string;
  updatedAt: string;
  restaurant: Restaurant;
}

interface SubsStats {
  totalCount: number;
  pendingCount: number;
  completedCount: number;
  failedCount: number;
  refundedCount: number;
  totalRevenue: number;
  planBreakdown: Record<string, number>;
}

type FilterStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "ALL";
type FilterPlan = "ALL" | "STARTER" | "PRO" | "ENTERPRISE";

export default function SubscriptionsPage() {
  const router = useRouter();
  
  // Data states
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("PENDING");
  const [planFilter, setPlanFilter] = useState<FilterPlan>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchSubscriptions();
    fetchStats();
  }, [statusFilter]);

  const getToken = () => localStorage.getItem("adminToken") || "";

  const fetchStats = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/subscriptions/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      
      // Build query params
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (planFilter !== "ALL") params.append("plan", planFilter);
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "50");
      
      const res = await fetch(`${API_URL}/api/admin/subscriptions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || data);
        return;
      }
      
      throw new Error("Failed to fetch");
    } catch (err: any) {
      // Fallback to pending endpoint if main endpoint fails
      if (statusFilter === "PENDING") {
        try {
          const token = getToken();
          const res = await fetch(`${API_URL}/api/admin/subscriptions/pending`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include"
          });
          if (res.ok) {
            const data = await res.json();
            setSubscriptions(Array.isArray(data) ? data : []);
            return;
          }
        } catch (e) {
          console.error("Fallback fetch failed:", e);
        }
      }
      setError(err.message || "Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, planFilter, searchQuery]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${id}/approve`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}` 
        },
        credentials: "include"
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to approve");
      }
      
      setSubscriptions(prev => prev.filter(s => s.id !== id));
      setSuccess("Subscription approved successfully! Plan has been upgraded.");
      setTimeout(() => setSuccess(""), 3000);
      fetchStats(); // Refresh stats
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${id}/reject`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}` 
        },
        credentials: "include"
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to reject");
      }
      
      setSubscriptions(prev => prev.filter(s => s.id !== id));
      setSuccess("Subscription rejected.");
      setTimeout(() => setSuccess(""), 3000);
      fetchStats(); // Refresh stats
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "STARTER": return "#4A6FA5";
      case "PRO": return "#6B4E9B";
      case "ENTERPRISE": return "#B8803E";
      default: return "#666";
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return { 
          bg: "#FDF8F2", 
          color: "#B8803E", 
          border: "#E8D0A0",
          icon: Clock,
          label: "Pending Approval"
        };
      case "COMPLETED":
        return { 
          bg: "#F0F7F2", 
          color: "#4A7C59", 
          border: "#C8E0D0",
          icon: CheckCircle,
          label: "Completed"
        };
      case "FAILED":
        return { 
          bg: "#FDF2F2", 
          color: "#C44444", 
          border: "#F0C8C8",
          icon: XCircle,
          label: "Rejected"
        };
      case "REFUNDED":
        return { 
          bg: "#F2F6FA", 
          color: "#4A6FA5", 
          border: "#C0D0E8",
          icon: TrendingDown,
          label: "Refunded"
        };
      default:
        return { 
          bg: "#F5F5F5", 
          color: "#666", 
          border: "#DDD",
          icon: AlertTriangle,
          label: status
        };
    }
  };

  // Filter subscriptions client-side for plan and search
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesPlan = planFilter === "ALL" || sub.plan === planFilter;
    const matchesSearch = !searchQuery || 
      sub.restaurant?.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.restaurant?.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.plan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlan && matchesSearch;
  });

  const pendingCount = stats?.pendingCount ?? subscriptions.filter(s => s.paymentStatus === "PENDING").length;
  const completedCount = stats?.completedCount ?? subscriptions.filter(s => s.paymentStatus === "COMPLETED").length;
  const failedCount = stats?.failedCount ?? subscriptions.filter(s => s.paymentStatus === "FAILED").length;
  const totalRevenue = stats?.totalRevenue ?? 0;

  if (loading && subscriptions.length === 0) {
    return (
      <div className="subs-loading">
        <RefreshCw className="spin" size={24} />
        <p>Loading subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="subscriptions-page">
      {/* Success Alert */}
      {success && (
        <div className="alert alert-success">
          <CheckCircle size={16} />
          <span>{success}</span>
          <button onClick={() => setSuccess("")}>&times;</button>
        </div>
      )}
      
      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={() => setError("")}>&times;</button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Subscriptions</h1>
          <p className="subs-subtitle">Manage all subscription requests and payments</p>
        </div>
        <div className="header-right">
          {loading && (
            <span className="live-indicator">
              <span className="live-dot" />
              Updating...
            </span>
          )}
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`btn-secondary ${showFilters ? "btn-active" : ""}`}
          >
            <Filter size={14} />
            Filters
            <ChevronDown size={14} className={`filter-arrow ${showFilters ? "rotate" : ""}`} />
          </button>
          <button onClick={() => { fetchSubscriptions(); fetchStats(); }} className="btn-secondary" disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="subs-tabs">
        <button
          className={`subs-tab ${statusFilter === "PENDING" ? "active" : ""}`}
          onClick={() => setStatusFilter("PENDING")}
        >
          <Clock size={14} />
          Pending
          {pendingCount > 0 && <span className="tab-count tab-count-amber">{pendingCount}</span>}
        </button>
        <button
          className={`subs-tab ${statusFilter === "COMPLETED" ? "active" : ""}`}
          onClick={() => setStatusFilter("COMPLETED")}
        >
          <CheckCircle size={14} />
          Completed
          {completedCount > 0 && <span className="tab-count tab-count-green">{completedCount}</span>}
        </button>
        <button
          className={`subs-tab ${statusFilter === "FAILED" ? "active" : ""}`}
          onClick={() => setStatusFilter("FAILED")}
        >
          <XCircle size={14} />
          Failed/Rejected
          {failedCount > 0 && <span className="tab-count tab-count-red">{failedCount}</span>}
        </button>
        <button
          className={`subs-tab ${statusFilter === "ALL" ? "active" : ""}`}
          onClick={() => setStatusFilter("ALL")}
        >
          All
          {stats?.totalCount ? <span className="tab-count">{stats.totalCount}</span> : null}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="subs-filters-panel">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by owner name, email, plan, or restaurant..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="search-clear" 
                onClick={() => setSearchQuery("")}
              >
                &times;
              </button>
            )}
          </div>
          <div className="filter-group">
            <label>Plan:</label>
            <select 
              value={planFilter} 
              onChange={e => setPlanFilter(e.target.value as FilterPlan)}
            >
              <option value="ALL">All Plans</option>
              <option value="STARTER">Starter ($10)</option>
              <option value="PRO">Pro ($20)</option>
              <option value="ENTERPRISE">Enterprise ($30)</option>
            </select>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="subs-stats-bar">
        <div className="subs-stat-item">
          <div className="subs-stat-icon subs-stat-icon-pending">
            <Clock size={18} />
          </div>
          <div className="subs-stat-content">
            <span className="subs-stat-value">{pendingCount}</span>
            <span className="subs-stat-label">Pending</span>
          </div>
        </div>
        <div className="subs-stat-item">
          <div className="subs-stat-icon subs-stat-icon-premium">
            <CreditCard size={18} />
          </div>
          <div className="subs-stat-content">
            <span className="subs-stat-value">{completedCount}</span>
            <span className="subs-stat-label">Completed</span>
          </div>
        </div>
        <div className="subs-stat-item">
          <div className="subs-stat-icon subs-stat-icon-value">
            <DollarSign size={18} />
          </div>
          <div className="subs-stat-content">
            <span className="subs-stat-value">${totalRevenue.toLocaleString()}</span>
            <span className="subs-stat-label">Total Revenue</span>
          </div>
        </div>
        <div className="subs-stat-item">
          <div className="subs-stat-icon subs-stat-icon-failed">
            <TrendingDown size={18} />
          </div>
          <div className="subs-stat-content">
            <span className="subs-stat-value">{failedCount}</span>
            <span className="subs-stat-label">Failed/Rejected</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredSubscriptions.length === 0 ? (
        <div className="subs-empty">
          <div className="subs-empty-icon">
            {statusFilter === "PENDING" && <CheckCircle size={48} />}
            {statusFilter === "COMPLETED" && <CheckCircle size={48} />}
            {statusFilter === "FAILED" && <XCircle size={48} />}
            {statusFilter === "ALL" && <CreditCard size={48} />}
          </div>
          <h3>
            {searchQuery 
              ? "No matching subscriptions" 
              : statusFilter === "PENDING" 
                ? "All Caught Up!" 
                : statusFilter === "COMPLETED"
                  ? "No Completed Subscriptions"
                  : statusFilter === "FAILED"
                    ? "No Failed Subscriptions"
                    : "No Subscriptions Found"}
          </h3>
          <p>
            {searchQuery 
              ? "Try adjusting your search or filters." 
              : statusFilter === "PENDING" 
                ? "There are no pending subscription requests at the moment." 
                : statusFilter === "COMPLETED"
                  ? "No subscriptions have been completed yet."
                  : statusFilter === "FAILED"
                    ? "No subscriptions have been rejected or failed."
                    : "No subscriptions match your current filters."}
          </p>
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(""); setPlanFilter("ALL"); }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="subs-grid">
          {filteredSubscriptions.map(sub => {
            const statusConfig = getStatusConfig(sub.paymentStatus);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div key={sub.id} className="subs-card">
                {/* Card Header */}
                <div className="subs-card-header">
                  <div className="subs-card-header-left">
                    <div 
                      className="subs-plan-badge"
                      style={{ 
                        background: `${getPlanColor(sub.plan)}15`, 
                        color: getPlanColor(sub.plan),
                        borderColor: `${getPlanColor(sub.plan)}30`
                      }}
                    >
                      {sub.plan}
                    </div>
                    <span className="subs-billing">
                      {sub.billingCycle?.toLowerCase() || "monthly"}
                    </span>
                  </div>
                  <span 
                    className="subs-status-badge"
                    style={{
                      background: statusConfig.bg,
                      color: statusConfig.color,
                      border: `1px solid ${statusConfig.border}`
                    }}
                  >
                    <StatusIcon size={12} />
                    {statusConfig.label}
                  </span>
                </div>

                {/* Price */}
                <div className="subs-price-section">
                  <span className="subs-price">${sub.price}</span>
                  <span className="subs-price-period">
                    per {sub.billingCycle?.toLowerCase() === "yearly" ? "year" : "month"}
                  </span>
                </div>

                {/* Owner Info */}
                <div className="subs-owner-section">
                  <div 
                    className="subs-owner-avatar"
                    style={{ background: getPlanColor(sub.plan) }}
                  >
                    {sub.restaurant?.owner?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="subs-owner-info">
                    <h4 className="subs-owner-name">
                      {sub.restaurant?.owner?.name || "Unknown"}
                    </h4>
                    <p className="subs-owner-email">
                      <Mail size={12} />
                      {sub.restaurant?.owner?.email || "No email"}
                    </p>
                    {sub.restaurant?.name && (
                      <p className="subs-owner-restaurant">
                        <Store size={12} />
                        {sub.restaurant.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="subs-details">
                  <div className="subs-detail-item">
                    <Calendar size={14} />
                    <div>
                      <span className="subs-detail-label">Request Date</span>
                      <span className="subs-detail-value">{formatDate(sub.purchasedAt)}</span>
                    </div>
                  </div>
                  <div className="subs-detail-item">
                    <Clock size={14} />
                    <div>
                      <span className="subs-detail-label">Period</span>
                      <span className="subs-detail-value">
                        {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
                      </span>
                    </div>
                  </div>
                  <div className="subs-detail-item">
                    <DollarSign size={14} />
                    <div>
                      <span className="subs-detail-label">Amount</span>
                      <span className="subs-detail-value">
                        ${sub.price} ({sub.billingCycle?.toLowerCase() || "monthly"})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions - Only for PENDING */}
                {sub.paymentStatus === "PENDING" && (
                  <div className="subs-actions">
                    <button
                      onClick={() => handleApprove(sub.id)}
                      disabled={processingId === sub.id}
                      className="subs-btn subs-btn-approve"
                    >
                      {processingId === sub.id ? (
                        <>
                          <RefreshCw size={16} className="spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(sub.id)}
                      disabled={processingId === sub.id}
                      className="subs-btn subs-btn-reject"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}