//admin/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, CreditCard, Store, DollarSign,
  ArrowUpRight, Clock, AlertCircle, TrendingUp,
  ChevronRight, UserPlus, Star, Zap, Crown,
  Activity
} from "lucide-react";
import "./dashboard.css";

interface PlanDistribution {
  FREE: number;
  STARTER: number;
  PRO: number;
  ENTERPRISE: number;
}

interface RecentActivity {
  type: string;
  message: string;
  timestamp: string;
}

interface Stats {
  totalUsers: number;
  totalRestaurants: number;
  pendingSubscriptions: number;
  completedSubscriptions: number;
  totalRevenue: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  verifiedUsers: number;
  adminUsers: number;
  planDistribution: PlanDistribution;
  recentActivity: RecentActivity[];
}

export default function DashboardOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchOverview();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchOverview, 60000);
    return () => clearInterval(interval);
  }, []);

  const getToken = () => localStorage.getItem("adminToken") || "";

  const fetchOverview = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      
      // Try new overview endpoint first
      try {
        const res = await fetch(`${API_URL}/api/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        });
        
        if (res.ok) {
          const data = await res.json();
          setStats(data);
          return;
        }
      } catch (e) {
        console.log("New endpoint not available, using fallback");
      }

      // Fallback: Fetch data from existing endpoints
      const [usersRes, subsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        }),
        fetch(`${API_URL}/api/admin/subscriptions/pending`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        }),
        fetch(`${API_URL}/api/admin/subscriptions/stats`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        }).catch(() => null)
      ]);

      if (!usersRes.ok) throw new Error("Failed to fetch data");
      
      const usersData = await usersRes.json();
      const users = usersData.users || usersData;
      const pendingSubs = await subsRes.json();
      const subsStats = statsRes ? await statsRes.json() : null;

      const totalUsers = users.length;
      const verifiedUsers = users.filter((u: any) => u.verified).length;
      const adminUsers = users.filter((u: any) => u.admin).length;
      const totalRestaurants = users.reduce(
        (acc: number, user: any) => acc + (user.restaurants?.length || 0), 
        0
      );
      
      const planDistribution: PlanDistribution = {
        FREE: 0,
        STARTER: 0,
        PRO: 0,
        ENTERPRISE: 0,
      };
      
      users.forEach((user: any) => {
        user.restaurants?.forEach((rest: any) => {
          if (planDistribution.hasOwnProperty(rest.plan)) {
            planDistribution[rest.plan as keyof PlanDistribution]++;
          }
        });
      });

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      
      const newUsersThisMonth = users.filter(
        (user: any) => new Date(user.createdAt) >= monthStart
      ).length;
      const newUsersThisWeek = users.filter(
        (user: any) => new Date(user.createdAt) >= weekStart
      ).length;

      const recentActivity: RecentActivity[] = [
        ...(Array.isArray(pendingSubs) ? pendingSubs.slice(0, 3).map((sub: any) => ({
          type: "subscription",
          message: `${sub.restaurant?.owner?.name || "Someone"} requested ${sub.plan} plan`,
          timestamp: sub.purchasedAt,
        })) : []),
        ...users.slice(-3).map((user: any) => ({
          type: "user",
          message: `${user.name} joined EasyMenu`,
          timestamp: user.createdAt,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

      setStats({
        totalUsers,
        totalRestaurants,
        pendingSubscriptions: subsStats?.pendingCount || (Array.isArray(pendingSubs) ? pendingSubs.length : 0),
        completedSubscriptions: subsStats?.completedCount || 0,
        totalRevenue: subsStats?.totalRevenue || 0,
        newUsersThisMonth,
        newUsersThisWeek,
        verifiedUsers,
        adminUsers,
        planDistribution,
        recentActivity,
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading && !stats) {
    return (
      <div className="overview-loading">
        <div className="spinner" />
        <p>Loading overview...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      <div className="page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening with EasyMenu.</p>
        </div>
        <div className="header-right">
          {loading && (
            <span className="live-indicator">
              <span className="live-dot" />
              Updating...
            </span>
          )}
          <button onClick={fetchOverview} className="btn-secondary" disabled={loading}>
            <Clock size={14} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError("")}>&times;</button>
        </div>
      )}

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="stats-grid">
            <div 
              className="stat-card stat-card-clickable"
              onClick={() => router.push("/dashboard/users")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && router.push("/dashboard/users")}
            >
              <div className="stat-card-inner">
                <div className="stat-icon stat-icon-blue">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">Total Users</p>
                  <p className="stat-value">{stats.totalUsers.toLocaleString()}</p>
                  <div className="stat-meta">
                    <span className="stat-sub">+{stats.newUsersThisWeek} this week</span>
                  </div>
                </div>
                <ChevronRight className="stat-arrow" size={20} />
              </div>
              <div className="stat-card-footer">
                <div className="stat-footer-item">
                  <UserPlus size={14} />
                  <span>{stats.verifiedUsers} verified</span>
                </div>
                <div className="stat-footer-item">
                  <Star size={14} />
                  <span>{stats.adminUsers} admins</span>
                </div>
              </div>
            </div>

            <div 
              className="stat-card stat-card-clickable"
              onClick={() => router.push("/dashboard/users")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && router.push("/dashboard/users")}
            >
              <div className="stat-card-inner">
                <div className="stat-icon stat-icon-terracotta">
                  <Store size={24} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">Restaurants</p>
                  <p className="stat-value">{stats.totalRestaurants.toLocaleString()}</p>
                  <div className="stat-meta">
                    <span className="stat-sub">Across all plans</span>
                  </div>
                </div>
                <ChevronRight className="stat-arrow" size={20} />
              </div>
              <div className="stat-card-footer">
                {Object.entries(stats.planDistribution)
                  .filter(([, count]) => count > 0)
                  .slice(0, 3)
                  .map(([plan, count]) => (
                    <div key={plan} className="stat-footer-item">
                      <span className={`plan-dot plan-dot-${plan.toLowerCase()}`} />
                      <span>{plan}: {count}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div 
              className={`stat-card stat-card-clickable ${stats.pendingSubscriptions > 0 ? "stat-card-warning" : ""}`}
              onClick={() => router.push("/dashboard/subscriptions")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && router.push("/dashboard/subscriptions")}
            >
              <div className="stat-card-inner">
                <div className="stat-icon stat-icon-amber">
                  <CreditCard size={24} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">Pending Requests</p>
                  <p className="stat-value">{stats.pendingSubscriptions}</p>
                  {stats.pendingSubscriptions > 0 ? (
                    <div className="stat-meta">
                      <span className="stat-sub stat-sub-warning">
                        <AlertCircle size={12} />
                        Needs attention
                      </span>
                    </div>
                  ) : (
                    <div className="stat-meta">
                      <span className="stat-sub">All clear</span>
                    </div>
                  )}
                </div>
                <ChevronRight className="stat-arrow" size={20} />
              </div>
              {stats.pendingSubscriptions > 0 && (
                <div className="stat-card-footer stat-card-footer-warning">
                  <span>Click to review {stats.pendingSubscriptions} pending request{stats.pendingSubscriptions > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>

            <div className="stat-card">
              <div className="stat-card-inner">
                <div className="stat-icon stat-icon-green">
                  <DollarSign size={24} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">Total Revenue</p>
                  <p className="stat-value">${stats.totalRevenue.toLocaleString()}</p>
                  <div className="stat-meta">
                    <span className="stat-sub">{stats.completedSubscriptions} completed</span>
                  </div>
                </div>
              </div>
              <div className="stat-card-footer">
                <div className="stat-footer-item">
                  <TrendingUp size={14} />
                  <span>All time revenue</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="section-nav-grid">
            <div 
              className="section-nav-card"
              onClick={() => router.push("/dashboard/users")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && router.push("/dashboard/users")}
            >
              <div className="section-nav-icon section-nav-icon-blue">
                <Users size={28} />
              </div>
              <div className="section-nav-content">
                <h3>Manage Users</h3>
                <p>View, edit, and manage all registered users and their restaurants</p>
                <div className="section-nav-stats">
                  <span>{stats.totalUsers} users</span>
                  <span>•</span>
                  <span>{stats.totalRestaurants} restaurants</span>
                  <span>•</span>
                  <span>{stats.newUsersThisMonth} new this month</span>
                </div>
              </div>
              <ArrowUpRight className="section-nav-arrow" size={20} />
            </div>

            <div 
              className="section-nav-card"
              onClick={() => router.push("/dashboard/subscriptions")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && router.push("/dashboard/subscriptions")}
            >
              <div className="section-nav-icon section-nav-icon-amber">
                <CreditCard size={28} />
              </div>
              <div className="section-nav-content">
                <h3>Subscriptions</h3>
                <p>Review and approve subscription upgrade requests from restaurant owners</p>
                <div className="section-nav-stats">
                  {stats.pendingSubscriptions > 0 ? (
                    <span className="section-nav-pending">{stats.pendingSubscriptions} pending approval</span>
                  ) : (
                    <span>No pending requests</span>
                  )}
                  <span>•</span>
                  <span>${stats.totalRevenue.toLocaleString()} revenue</span>
                </div>
              </div>
              <ArrowUpRight className="section-nav-arrow" size={20} />
            </div>
          </div>

          {/* Plan Distribution & Recent Activity */}
          <div className="overview-grid">
            <div className="overview-card">
              <h2>
                <Activity size={18} />
                Plan Distribution
              </h2>
              <div className="plan-distribution">
                {Object.entries(stats.planDistribution).map(([plan, count]) => {
                  const percentage = stats.totalRestaurants > 0 
                    ? Math.round((count / stats.totalRestaurants) * 100) 
                    : 0;
                  return (
                    <div key={plan} className="plan-bar">
                      <div className="plan-bar-header">
                        <div className="plan-bar-label-group">
                          {plan === "FREE" && <Zap size={14} className="plan-icon" />}
                          {plan === "STARTER" && <Star size={14} className="plan-icon" />}
                          {plan === "PRO" && <Crown size={14} className="plan-icon" />}
                          {plan === "ENTERPRISE" && <Star size={14} className="plan-icon plan-icon-gold" />}
                          <span className={`plan-label plan-label-${plan.toLowerCase()}`}>{plan}</span>
                        </div>
                        <div className="plan-bar-stats">
                          <span className="plan-count">{count}</span>
                          <span className="plan-percentage">{percentage}%</span>
                        </div>
                      </div>
                      <div className="plan-bar-track">
                        <div
                          className={`plan-bar-fill plan-bar-${plan.toLowerCase()}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overview-card">
              <h2>
                <Clock size={18} />
                Recent Activity
              </h2>
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="activity-list">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className={`activity-dot activity-dot-${activity.type}`} />
                      <div className="activity-content">
                        <p className="activity-message">{activity.message}</p>
                        <p className="activity-time">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="activity-empty">
                  <Clock size={32} />
                  <p>No recent activity</p>
                  <p className="activity-empty-sub">New user registrations and subscription requests will appear here</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}