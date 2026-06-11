// app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, LogOut, CheckCircle, XCircle, RefreshCw,
  Users, CreditCard, Store, Mail, Calendar, Search, Phone,
  MapPin, Edit2, Trash2, AlertTriangle, ChevronDown, ChevronRight,
  Clock
} from "lucide-react";
import "./dashboard.css";

type TabType = "subscriptions" | "users";

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
  description: string | null;
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
  _count: { restaurants: number };
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
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("subscriptions");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");
    
    if (!token || !user) {
      router.push("/login");
      return;
    }

    const parsed = JSON.parse(user);
    if (!parsed.admin) {
      router.push("/login");
      return;
    }

    setAdminUser(parsed);
    loadData(token);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const q = searchQuery.toLowerCase();
    setFilteredUsers(
      users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.restaurants?.some(r =>
          r.name.toLowerCase().includes(q) ||
          r.phone?.includes(q) ||
          r.address?.toLowerCase().includes(q)
        )
      )
    );
  }, [searchQuery, users]);

  const getToken = () => localStorage.getItem("adminToken") || "";

  const loadData = async (token: string) => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSubscriptions(token),
        fetchUsers(token)
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async (token: string) => {
    const res = await fetch(`${API_URL}/api/admin/subscriptions/pending`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include"
    });
    if (!res.ok) throw new Error("Failed to fetch subscriptions");
    setSubscriptions(await res.json());
  };

  const fetchUsers = async (token: string) => {
    const res = await fetch(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include"
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    const data = await res.json();
    setUsers(data);
    setFilteredUsers(data);
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to approve");
      setSubscriptions(prev => prev.filter(s => s.id !== id));
      showSuccess("Subscription approved");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to reject");
      setSubscriptions(prev => prev.filter(s => s.id !== id));
      showSuccess("Subscription rejected");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setSaving(true);
    
    try {
      let res;
      if (editingItem.type === "user") {
        res = await fetch(`${API_URL}/api/admin/users/${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            name: editingItem.name,
            email: editingItem.email,
            admin: editingItem.admin,
            verified: editingItem.verified
          })
        });
      } else {
        res = await fetch(`${API_URL}/api/admin/restaurants/${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            name: editingItem.name,
            phone: editingItem.phone,
            plan: editingItem.plan,
            address: editingItem.address
          })
        });
      }
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update");
      }
      
      showSuccess(`${editingItem.type === "user" ? "User" : "Restaurant"} updated`);
      setEditingItem(null);
      fetchUsers(getToken());
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSaving(true);
    
    try {
      const endpoint = deletingItem.type === "user" 
        ? `${API_URL}/api/admin/users/${deletingItem.id}`
        : `${API_URL}/api/admin/restaurants/${deletingItem.id}`;
        
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete");
      }
      
      showSuccess(`${deletingItem.type === "user" ? "User" : "Restaurant"} deleted`);
      setDeletingItem(null);
      fetchUsers(getToken());
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    ["adminToken", "adminUser", "adminRestaurantId", "adminRestaurantName"].forEach(
      key => localStorage.removeItem(key)
    );
    router.push("/login");
  };

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="loading-screen">
        <RefreshCw className="spin" size={24} />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Shield size={20} />
          </div>
          <span className="brand-name">EasyMenu</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "subscriptions" ? "active" : ""}`}
            onClick={() => setActiveTab("subscriptions")}
          >
            <CreditCard size={18} />
            Subscriptions
            {subscriptions.length > 0 && (
              <span className="nav-count">{subscriptions.length}</span>
            )}
          </button>
          <button
            className={`nav-item ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <Users size={18} />
            Users
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <p className="sidebar-user-name">{adminUser?.name}</p>
            <p className="sidebar-user-email">{adminUser?.email}</p>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main">
        {success && (
          <div className="alert alert-success">
            <CheckCircle size={16} />
            {success}
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
            <button onClick={() => setError("")}>&times;</button>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <>
            <div className="page-header">
              <h1>Pending Subscriptions</h1>
              <button onClick={() => fetchSubscriptions(getToken())} className="btn-secondary">
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>

            {subscriptions.length === 0 ? (
              <div className="empty-state">
                <CheckCircle size={40} />
                <h3>No pending requests</h3>
                <p>All subscription requests have been processed</p>
              </div>
            ) : (
              <div className="subs-grid">
                {subscriptions.map(sub => (
                  <div key={sub.id} className="sub-card">
                    <div className="sub-card-top">
                      <span className={`plan-tag plan-${sub.plan.toLowerCase()}`}>
                        {sub.plan}
                      </span>
                      <span className="sub-price">${sub.price}/{sub.billingCycle.toLowerCase()}</span>
                    </div>
                    <div className="sub-card-body">
                      <div className="sub-row">
                        <span className="sub-label">Owner</span>
                        <span className="sub-value">{sub.restaurant.owner.name}</span>
                      </div>
                      <div className="sub-row">
                        <span className="sub-label">Email</span>
                        <span className="sub-value">{sub.restaurant.owner.email}</span>
                      </div>
                      <div className="sub-row">
                        <span className="sub-label">Purchased</span>
                        <span className="sub-value">{formatDate(sub.purchasedAt)}</span>
                      </div>
                    </div>
                    <div className="sub-card-actions">
                      <button
                        onClick={() => handleApprove(sub.id)}
                        disabled={processingId === sub.id}
                        className="btn-approve"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(sub.id)}
                        disabled={processingId === sub.id}
                        className="btn-reject"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "users" && (
          <>
            <div className="page-header">
              <h1>Users</h1>
              <div className="header-right">
                <div className="search-box">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search users, restaurants or phone..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <button onClick={() => fetchUsers(getToken())} className="btn-secondary">
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="empty-state">
                <Search size={40} />
                <h3>No users found</h3>
                <p>{searchQuery ? "Try a different search term" : "No users registered yet"}</p>
              </div>
            ) : (
              <div className="users-list">
                {filteredUsers.map(user => (
                  <div key={user.id} className="user-card">
                    <div className="user-card-header">
                      <div className="user-info">
                        <div className="user-avatar" style={{ background: "#C45E3A" }}>
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <h3 className="user-name">{user.name}</h3>
                          <p className="user-email">{user.email}</p>
                        </div>
                      </div>

                      <div className="user-tags">
                        <span className={`tag ${user.admin ? "tag-admin" : "tag-user"}`}>
                          {user.admin ? "Admin" : "User"}
                        </span>
                        <span className={`tag ${user.verified ? "tag-verified" : "tag-pending"}`}>
                          {user.verified ? (
                            <><CheckCircle size={12} /> Verified</>
                          ) : (
                            <><Clock size={12} /> Pending</>
                          )}
                        </span>
                        <span className="tag tag-date">
                          <Calendar size={12} />
                          {formatDate(user.createdAt)}
                        </span>
                      </div>

                      <div className="user-actions">
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => setEditingItem({
                            type: "user",
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            admin: user.admin,
                            verified: user.verified
                          })}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          title="Delete"
                          onClick={() => setDeletingItem({
                            type: "user",
                            id: user.id,
                            name: user.name
                          })}
                        >
                          <Trash2 size={15} />
                        </button>
                        {user.restaurants?.length > 0 && (
                          <button
                            className={`btn-icon ${expandedUsers.has(user.id) ? "rotate" : ""}`}
                            title="Restaurants"
                            onClick={() => toggleUserExpand(user.id)}
                          >
                            <ChevronDown size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {expandedUsers.has(user.id) && user.restaurants?.length > 0 && (
                      <div className="restaurants-section">
                        <div className="restaurants-section-title">
                          <Store size={14} />
                          Restaurants ({user.restaurants.length})
                        </div>
                        <div className="restaurants-grid">
                          {user.restaurants.map(rest => (
                            <div key={rest.id} className="rest-card">
                              <div className="rest-card-header">
                                <h4>{rest.name}</h4>
                                <span className={`plan-tag plan-${rest.plan.toLowerCase()}`}>
                                  {rest.plan}
                                </span>
                              </div>
                              <div className="rest-card-details">
                                {rest.phone && (
                                  <div className="rest-detail">
                                    <Phone size={13} />
                                    {rest.phone}
                                  </div>
                                )}
                                {rest.address && (
                                  <div className="rest-detail">
                                    <MapPin size={13} />
                                    <span className="truncate">{rest.address}</span>
                                  </div>
                                )}
                                <div className="rest-detail rest-detail-date">
                                  <Calendar size={13} />
                                  Created {formatDate(rest.createdAt)}
                                </div>
                              </div>
                              <div className="rest-card-actions">
                                <button
                                  className="btn-sm"
                                  onClick={() => setEditingItem({
                                    type: "restaurant",
                                    id: rest.id,
                                    name: rest.name,
                                    phone: rest.phone || "",
                                    plan: rest.plan,
                                    address: rest.address || ""
                                  })}
                                >
                                  <Edit2 size={12} />
                                  Edit
                                </button>
                                <button
                                  className="btn-sm btn-sm-danger"
                                  onClick={() => setDeletingItem({
                                    type: "restaurant",
                                    id: rest.id,
                                    name: rest.name
                                  })}
                                >
                                  <Trash2 size={12} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit {editingItem.type}</h2>
              <button className="modal-close" onClick={() => setEditingItem(null)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>

              {editingItem.type === "user" && (
                <>
                  <div className="form-field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editingItem.email}
                      onChange={e => setEditingItem({ ...editingItem, email: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label>Role</label>
                      <select
                        value={editingItem.admin ? "admin" : "user"}
                        onChange={e => setEditingItem({ ...editingItem, admin: e.target.value === "admin" })}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Status</label>
                      <select
                        value={editingItem.verified ? "verified" : "pending"}
                        onChange={e => setEditingItem({ ...editingItem, verified: e.target.value === "verified" })}
                      >
                        <option value="verified">Verified</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {editingItem.type === "restaurant" && (
                <>
                  <div className="form-field">
                    <label>Phone</label>
                    <input
                      type="text"
                      value={editingItem.phone}
                      onChange={e => setEditingItem({ ...editingItem, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Plan</label>
                    <select
                      value={editingItem.plan}
                      onChange={e => setEditingItem({ ...editingItem, plan: e.target.value })}
                    >
                      <option value="FREE">FREE</option>
                      <option value="STARTER">STARTER</option>
                      <option value="PRO">PRO</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Address</label>
                    <input
                      type="text"
                      value={editingItem.address}
                      onChange={e => setEditingItem({ ...editingItem, address: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditingItem(null)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingItem && (
        <div className="modal-overlay" onClick={() => setDeletingItem(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete {deletingItem.type}</h2>
              <button className="modal-close" onClick={() => setDeletingItem(null)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this {deletingItem.type}?</p>
              <div className="delete-target">
                <strong>{deletingItem.name}</strong>
                <span className="delete-target-type">{deletingItem.type}</span>
              </div>
              <p className="delete-warning">This action cannot be undone. All associated data will be permanently removed.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeletingItem(null)}>
                Cancel
              </button>
              <button className="btn-delete" onClick={handleDelete} disabled={saving}>
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}