//admin/app/dashboard/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Search, RefreshCw, Edit2, Trash2, ChevronDown,
  Store, Phone, MapPin, Calendar, Clock, CheckCircle, Mail,
  AlertTriangle, XCircle, Filter, UserPlus, Shield
} from "lucide-react";
import "./users.css";

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

type FilterRole = "ALL" | "admin" | "user";
type FilterStatus = "ALL" | "verified" | "unverified";
type FilterPlan = "ALL" | "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export default function UsersPage() {
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<FilterRole>("ALL");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [planFilter, setPlanFilter] = useState<FilterPlan>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchUsers();
  }, []);

  const getToken = () => localStorage.getItem("adminToken") || "";

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users || data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setSaving(true);
    setError("");
    
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
            address: editingItem.address,
            description: editingItem.description
          })
        });
      }
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update");
      }
      
      setSuccess(`${editingItem.type === "user" ? "User" : "Restaurant"} updated successfully`);
      setTimeout(() => setSuccess(""), 3000);
      setEditingItem(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSaving(true);
    setError("");
    
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
      
      setSuccess(`${deletingItem.type === "user" ? "User" : "Restaurant"} deleted successfully`);
      setTimeout(() => setSuccess(""), 3000);
      setDeletingItem(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const expandAll = () => {
    if (expandedUsers.size === filteredUsers.length) {
      setExpandedUsers(new Set());
    } else {
      setExpandedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setPlanFilter("ALL");
  };

  const hasActiveFilters = searchQuery || roleFilter !== "ALL" || statusFilter !== "ALL" || planFilter !== "ALL";

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  const getPlanBadgeClass = (plan: string) => {
    switch (plan) {
      case "FREE": return "plan-free";
      case "STARTER": return "plan-starter";
      case "PRO": return "plan-pro";
      case "ENTERPRISE": return "plan-enterprise";
      default: return "";
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.restaurants?.some(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone?.includes(searchQuery) ||
        r.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesRole = roleFilter === "ALL" || 
      (roleFilter === "admin" ? user.admin : !user.admin);
    
    const matchesStatus = statusFilter === "ALL" ||
      (statusFilter === "verified" ? user.verified : !user.verified);
    
    const matchesPlan = planFilter === "ALL" ||
      user.restaurants?.some(r => r.plan === planFilter);
    
    return matchesSearch && matchesRole && matchesStatus && matchesPlan;
  });

  // Stats
  const totalUsers = users.length;
  const verifiedUsers = users.filter(u => u.verified).length;
  const adminUsers = users.filter(u => u.admin).length;
  const totalRestaurants = users.reduce((acc, u) => acc + (u.restaurants?.length || 0), 0);
  const newUsersToday = users.filter(u => {
    const today = new Date();
    const created = new Date(u.createdAt);
    return created.toDateString() === today.toDateString();
  }).length;

  if (loading && users.length === 0) {
    return (
      <div className="users-loading">
        <RefreshCw className="spin" size={24} />
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="users-page">
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
          <h1>Users</h1>
          <p className="users-subtitle">Manage all registered users and their restaurants</p>
        </div>
        <div className="header-right">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`btn-secondary ${showFilters ? "btn-active" : ""}`}
          >
            <Filter size={14} />
            Filters
            {hasActiveFilters && <span className="filter-indicator" />}
          </button>
          <button onClick={fetchUsers} className="btn-secondary" disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="users-filters-panel">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, email, restaurant, phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery("")}>&times;</button>
            )}
          </div>
          <div className="filter-group">
            <label>Role:</label>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as FilterRole)}>
              <option value="ALL">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Status:</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as FilterStatus)}>
              <option value="ALL">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Plan:</label>
            <select value={planFilter} onChange={e => setPlanFilter(e.target.value as FilterPlan)}>
              <option value="ALL">All Plans</option>
              <option value="FREE">Free</option>
              <option value="STARTER">Starter</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="btn-clear-filters">
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Stats Bar */}
      <div className="users-stats-bar">
        <div className="users-stat-item">
          <div className="users-stat-icon users-stat-icon-total">
            <Users size={18} />
          </div>
          <div className="users-stat-content">
            <span className="users-stat-value">{totalUsers}</span>
            <span className="users-stat-label">Total Users</span>
          </div>
        </div>
        <div className="users-stat-item">
          <div className="users-stat-icon users-stat-icon-verified">
            <CheckCircle size={18} />
          </div>
          <div className="users-stat-content">
            <span className="users-stat-value">{verifiedUsers}</span>
            <span className="users-stat-label">Verified</span>
          </div>
        </div>
        <div className="users-stat-item">
          <div className="users-stat-icon users-stat-icon-admin">
            <Shield size={18} />
          </div>
          <div className="users-stat-content">
            <span className="users-stat-value">{adminUsers}</span>
            <span className="users-stat-label">Admins</span>
          </div>
        </div>
        <div className="users-stat-item">
          <div className="users-stat-icon users-stat-icon-restaurant">
            <Store size={18} />
          </div>
          <div className="users-stat-content">
            <span className="users-stat-value">{totalRestaurants}</span>
            <span className="users-stat-label">Restaurants</span>
          </div>
        </div>
        <div className="users-stat-item">
          <div className="users-stat-icon users-stat-icon-new">
            <UserPlus size={18} />
          </div>
          <div className="users-stat-content">
            <span className="users-stat-value">{newUsersToday}</span>
            <span className="users-stat-label">New Today</span>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="users-results-info">
        <span>
          Showing <strong>{filteredUsers.length}</strong> of <strong>{totalUsers}</strong> users
          {hasActiveFilters && " (filtered)"}
        </span>
        <div className="users-results-actions">
          {filteredUsers.length > 0 && (
            <button onClick={expandAll} className="btn-text">
              {expandedUsers.size === filteredUsers.length ? "Collapse All" : "Expand All"}
            </button>
          )}
        </div>
      </div>

      {/* Users List or Empty State */}
      {filteredUsers.length === 0 ? (
        <div className="users-empty">
          <div className="users-empty-content">
            <div className="users-empty-icon">
              {hasActiveFilters ? <Search size={40} /> : <Users size={40} />}
            </div>
            <h3>{hasActiveFilters ? "No users match your filters" : "No users yet"}</h3>
            <p>
              {hasActiveFilters 
                ? "Try adjusting your search criteria or filters to find what you're looking for."
                : "No users have registered yet. New users will appear here."}
            </p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="btn-clear-filters-center">
                <XCircle size={14} />
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="users-list">
          {filteredUsers.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <div className="user-info-main" onClick={() => toggleUserExpand(user.id)}>
                  <div className="user-avatar" style={{ background: "var(--terracotta)" }}>
                    {getInitials(user.name)}
                  </div>
                  <div className="user-details">
                    <h3 className="user-name">{user.name}</h3>
                    <p className="user-email">
                      <Mail size={12} />
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="user-tags">
                  {user.admin ? (
                    <span className="user-tag tag-admin">
                      <Shield size={10} />
                      Admin
                    </span>
                  ) : (
                    <span className="user-tag tag-user">User</span>
                  )}
                  
                  {user.verified ? (
                    <span className="user-tag tag-verified">
                      <CheckCircle size={10} />
                      Verified
                    </span>
                  ) : (
                    <span className="user-tag tag-pending">
                      <Clock size={10} />
                      Pending
                    </span>
                  )}
                  
                  <span className="user-tag tag-date">
                    <Calendar size={10} />
                    {formatDate(user.createdAt)}
                  </span>
                  
                  {user.restaurants?.[0] && (
                    <span className={`user-tag tag-plan ${getPlanBadgeClass(user.restaurants[0].plan)}`}>
                      {user.restaurants[0].plan}
                    </span>
                  )}
                </div>

                <div className="user-actions">
                  <button
                    className="btn-icon"
                    title="Edit user"
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
                    title="Delete user"
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
                      title="View restaurants"
                      onClick={() => toggleUserExpand(user.id)}
                    >
                      <ChevronDown size={15} />
                      {user.restaurants.length > 1 && (
                        <span className="restaurant-count-badge">{user.restaurants.length}</span>
                      )}
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
                          <span className={`plan-badge ${getPlanBadgeClass(rest.plan)}`}>
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
                              address: rest.address || "",
                              description: rest.description || ""
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

      {/* Edit Modal */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => !saving && setEditingItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit {editingItem.type}</h2>
              <button className="modal-close" onClick={() => setEditingItem(null)} disabled={saving}>
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
                  disabled={saving}
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
                      disabled={saving}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label>Role</label>
                      <select
                        value={editingItem.admin ? "admin" : "user"}
                        onChange={e => setEditingItem({ ...editingItem, admin: e.target.value === "admin" })}
                        disabled={saving}
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
                        disabled={saving}
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
                      disabled={saving}
                    />
                  </div>
                  <div className="form-field">
                    <label>Plan</label>
                    <select
                      value={editingItem.plan}
                      onChange={e => setEditingItem({ ...editingItem, plan: e.target.value })}
                      disabled={saving}
                    >
                      <option value="FREE">FREE</option>
                      <option value="STARTER">STARTER ($10/mo)</option>
                      <option value="PRO">PRO ($20/mo)</option>
                      <option value="ENTERPRISE">ENTERPRISE ($30/mo)</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Address</label>
                    <input
                      type="text"
                      value={editingItem.address}
                      onChange={e => setEditingItem({ ...editingItem, address: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                  <div className="form-field">
                    <label>Description</label>
                    <textarea
                      value={editingItem.description || ""}
                      onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                      disabled={saving}
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditingItem(null)} disabled={saving}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="modal-overlay" onClick={() => !saving && setDeletingItem(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <AlertTriangle size={18} className="modal-warning-icon" />
                Delete {deletingItem.type}
              </h2>
              <button className="modal-close" onClick={() => setDeletingItem(null)} disabled={saving}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to permanently delete this {deletingItem.type}?</p>
              <div className="delete-target">
                <strong>{deletingItem.name}</strong>
                <span className="delete-target-type">{deletingItem.type}</span>
              </div>
              {deletingItem.type === "user" && (
                <div className="delete-info">
                  <AlertTriangle size={14} />
                  <span>Deleting this user will also remove all their restaurants and data.</span>
                </div>
              )}
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeletingItem(null)} disabled={saving}>
                Cancel
              </button>
              <button className="btn-delete" onClick={handleDelete} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}