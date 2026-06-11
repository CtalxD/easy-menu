//admin/app/dashboard/restaurants/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store, Search, RefreshCw, Edit2, Trash2, ChevronDown,
  Phone, MapPin, Calendar, CheckCircle, Mail, User,
  AlertTriangle, XCircle, Filter, Building2, Star, Zap,
  Crown, ArrowUp
} from "lucide-react";
import "./restaurants.css";

interface Owner {
  id: string;
  name: string;
  email: string;
}

interface Restaurant {
  id: string;
  name: string;
  plan: string;
  phone: string | null;
  address: string | null;
  description: string | null;
  email: string | null;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
  owner: Owner;
  _count?: {
    menuItems: number;
    categories: number;
    menuViews: number;
  };
}

type FilterPlan = "ALL" | "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
type SortField = "name" | "plan" | "createdAt" | "owner";

export default function RestaurantsPage() {
  const router = useRouter();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<FilterPlan>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [deletingRestaurant, setDeletingRestaurant] = useState<Restaurant | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const getToken = () => localStorage.getItem("adminToken") || "";

  const fetchRestaurants = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/restaurants`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data.restaurants || data);
        return;
      }

      // Fallback: Get users and extract restaurants
      const usersRes = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      
      if (!usersRes.ok) throw new Error("Failed to fetch restaurants");
      
      const usersData = await usersRes.json();
      const users = usersData.users || usersData;
      
      const allRestaurants: Restaurant[] = [];
      users.forEach((user: any) => {
        if (user.restaurants) {
          user.restaurants.forEach((rest: any) => {
            allRestaurants.push({
              ...rest,
              owner: {
                id: user.id,
                name: user.name,
                email: user.email,
              },
            });
          });
        }
      });
      
      setRestaurants(allRestaurants);
    } catch (err: any) {
      setError(err.message || "Failed to fetch restaurants");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingRestaurant) return;
    setSaving(true);
    setError("");
    
    try {
      const res = await fetch(`${API_URL}/api/admin/restaurants/${editingRestaurant.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          name: editingRestaurant.name,
          phone: editingRestaurant.phone,
          plan: editingRestaurant.plan,
          address: editingRestaurant.address,
          description: editingRestaurant.description,
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update");
      }
      
      setSuccess("Restaurant updated successfully");
      setTimeout(() => setSuccess(""), 3000);
      setEditingRestaurant(null);
      fetchRestaurants();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRestaurant) return;
    setSaving(true);
    setError("");
    
    try {
      const res = await fetch(`${API_URL}/api/admin/restaurants/${deletingRestaurant.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete");
      }
      
      setSuccess("Restaurant deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
      setDeletingRestaurant(null);
      fetchRestaurants();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setPlanFilter("ALL");
  };

  const hasActiveFilters = searchQuery !== "" || planFilter !== "ALL";

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "FREE": return <Zap size={14} />;
      case "STARTER": return <Star size={14} />;
      case "PRO": return <Crown size={14} />;
      case "ENTERPRISE": return <Building2 size={14} />;
      default: return null;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "FREE": return "#999";
      case "STARTER": return "#4A6FA5";
      case "PRO": return "#6B4E9B";
      case "ENTERPRISE": return "#B8803E";
      default: return "#666";
    }
  };

  // Filter and sort
  const filteredRestaurants = restaurants
    .filter(rest => {
      const matchesSearch = !searchQuery || 
        rest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rest.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rest.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rest.phone?.includes(searchQuery) ||
        rest.address?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPlan = planFilter === "ALL" || rest.plan === planFilter;
      
      return matchesSearch && matchesPlan;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "plan":
          comparison = a.plan.localeCompare(b.plan);
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "owner":
          comparison = (a.owner?.name || "").localeCompare(b.owner?.name || "");
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Stats
  const totalRestaurants = restaurants.length;
  const freeCount = restaurants.filter(r => r.plan === "FREE").length;
  const starterCount = restaurants.filter(r => r.plan === "STARTER").length;
  const proCount = restaurants.filter(r => r.plan === "PRO").length;
  const enterpriseCount = restaurants.filter(r => r.plan === "ENTERPRISE").length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUp size={12} className="sort-inactive" />;
    return <ArrowUp size={12} className={`sort-active ${sortOrder === "desc" ? "sort-desc" : ""}`} />;
  };

  if (loading && restaurants.length === 0) {
    return (
      <div className="restaurants-loading">
        <RefreshCw className="spin" size={24} />
        <p>Loading restaurants...</p>
      </div>
    );
  }

  return (
    <div className="restaurants-page">
      {/* Alerts */}
      {success && (
        <div className="alert alert-success">
          <CheckCircle size={16} />
          <span>{success}</span>
          <button onClick={() => setSuccess("")}>&times;</button>
        </div>
      )}
      
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
          <h1>Restaurants</h1>
          <p className="restaurants-subtitle">View and manage all registered restaurants</p>
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
          <button onClick={fetchRestaurants} className="btn-secondary" disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="restaurants-filters-panel">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, owner, email, phone, address..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery("")}>&times;</button>
            )}
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
      <div className="restaurants-stats-bar">
        <div className="restaurants-stat-item">
          <div className="restaurants-stat-icon restaurants-stat-icon-total">
            <Store size={18} />
          </div>
          <div className="restaurants-stat-content">
            <span className="restaurants-stat-value">{totalRestaurants}</span>
            <span className="restaurants-stat-label">Total</span>
          </div>
        </div>
        <div className="restaurants-stat-item">
          <div className="restaurants-stat-icon restaurants-stat-icon-free">
            <Zap size={18} />
          </div>
          <div className="restaurants-stat-content">
            <span className="restaurants-stat-value">{freeCount}</span>
            <span className="restaurants-stat-label">Free</span>
          </div>
        </div>
        <div className="restaurants-stat-item">
          <div className="restaurants-stat-icon restaurants-stat-icon-starter">
            <Star size={18} />
          </div>
          <div className="restaurants-stat-content">
            <span className="restaurants-stat-value">{starterCount}</span>
            <span className="restaurants-stat-label">Starter</span>
          </div>
        </div>
        <div className="restaurants-stat-item">
          <div className="restaurants-stat-icon restaurants-stat-icon-pro">
            <Crown size={18} />
          </div>
          <div className="restaurants-stat-content">
            <span className="restaurants-stat-value">{proCount}</span>
            <span className="restaurants-stat-label">Pro</span>
          </div>
        </div>
        <div className="restaurants-stat-item">
          <div className="restaurants-stat-icon restaurants-stat-icon-enterprise">
            <Building2 size={18} />
          </div>
          <div className="restaurants-stat-content">
            <span className="restaurants-stat-value">{enterpriseCount}</span>
            <span className="restaurants-stat-label">Enterprise</span>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="restaurants-results-info">
        <span>
          Showing <strong>{filteredRestaurants.length}</strong> of <strong>{totalRestaurants}</strong> restaurants
          {hasActiveFilters && " (filtered)"}
        </span>
      </div>

      {/* Empty State */}
      {filteredRestaurants.length === 0 ? (
        <div className="restaurants-empty">
          <div className="restaurants-empty-content">
            <div className="restaurants-empty-icon">
              {hasActiveFilters ? <Search size={40} /> : <Store size={40} />}
            </div>
            <h3>{hasActiveFilters ? "No restaurants match your filters" : "No restaurants yet"}</h3>
            <p>
              {hasActiveFilters 
                ? "Try adjusting your search criteria or filters."
                : "No restaurants have been registered yet."}
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
        <div className="restaurants-table-wrapper">
          <table className="restaurants-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}></th>
                <th onClick={() => handleSort("name")} className="sortable">
                  Restaurant <SortIcon field="name" />
                </th>
                <th onClick={() => handleSort("owner")} className="sortable">
                  Owner <SortIcon field="owner" />
                </th>
                <th onClick={() => handleSort("plan")} className="sortable">
                  Plan <SortIcon field="plan" />
                </th>
                <th>Contact</th>
                <th onClick={() => handleSort("createdAt")} className="sortable">
                  Created <SortIcon field="createdAt" />
                </th>
                <th style={{ width: "100px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRestaurants.map(rest => (
                <tr key={`row-${rest.id}`} className={`restaurants-row ${expandedRows.has(rest.id) ? "expanded" : ""}`}>
                  <td>
                    <button 
                      className={`expand-btn ${expandedRows.has(rest.id) ? "rotate" : ""}`}
                      onClick={() => toggleRowExpand(rest.id)}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </td>
                  <td>
                    <div className="rest-name-cell">
                      <div className="rest-avatar" style={{ background: getPlanColor(rest.plan) }}>
                        {rest.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="rest-name">{rest.name}</span>
                        {rest.description && (
                          <span className="rest-desc-preview">{rest.description.substring(0, 50)}...</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="owner-cell">
                      <span className="owner-name">{rest.owner?.name || "Unknown"}</span>
                      <span className="owner-email">{rest.owner?.email || "N/A"}</span>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="plan-cell"
                      style={{ 
                        background: `${getPlanColor(rest.plan)}15`, 
                        color: getPlanColor(rest.plan),
                        borderColor: `${getPlanColor(rest.plan)}30`
                      }}
                    >
                      {getPlanIcon(rest.plan)}
                      {rest.plan}
                    </span>
                  </td>
                  <td>
                    <div className="contact-cell">
                      {rest.phone && (
                        <span className="contact-item">
                          <Phone size={12} />
                          {rest.phone}
                        </span>
                      )}
                      {rest.email && (
                        <span className="contact-item">
                          <Mail size={12} />
                          {rest.email}
                        </span>
                      )}
                      {!rest.phone && !rest.email && (
                        <span className="contact-na">No contact info</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="date-cell">{formatDate(rest.createdAt)}</span>
                  </td>
                  <td>
                    <div className="action-cell">
                      <button
                        className="btn-icon"
                        title="Edit"
                        onClick={() => setEditingRestaurant(rest)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn-icon btn-icon-danger"
                        title="Delete"
                        onClick={() => setDeletingRestaurant(rest)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRestaurants.map(rest => 
                expandedRows.has(rest.id) && (
                  <tr key={`expanded-${rest.id}`} className="expanded-row">
                    <td colSpan={7}>
                      <div className="expanded-content">
                        <div className="expanded-grid">
                          <div className="expanded-section">
                            <h4>Restaurant Details</h4>
                            <div className="expanded-details">
                              <div className="expanded-detail">
                                <span className="detail-label">Name</span>
                                <span className="detail-value">{rest.name}</span>
                              </div>
                              {rest.description && (
                                <div className="expanded-detail">
                                  <span className="detail-label">Description</span>
                                  <span className="detail-value">{rest.description}</span>
                                </div>
                              )}
                              <div className="expanded-detail">
                                <span className="detail-label">Plan</span>
                                <span className="detail-value">
                                  <span 
                                    className="plan-cell"
                                    style={{ 
                                      background: `${getPlanColor(rest.plan)}15`, 
                                      color: getPlanColor(rest.plan),
                                      borderColor: `${getPlanColor(rest.plan)}30`
                                    }}
                                  >
                                    {getPlanIcon(rest.plan)}
                                    {rest.plan}
                                  </span>
                                </span>
                              </div>
                              <div className="expanded-detail">
                                <span className="detail-label">Created</span>
                                <span className="detail-value">
                                  <Calendar size={12} />
                                  {formatDate(rest.createdAt)}
                                </span>
                              </div>
                              <div className="expanded-detail">
                                <span className="detail-label">Last Updated</span>
                                <span className="detail-value">
                                  <Calendar size={12} />
                                  {formatDate(rest.updatedAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="expanded-section">
                            <h4>Contact Information</h4>
                            <div className="expanded-details">
                              <div className="expanded-detail">
                                <span className="detail-label">Phone</span>
                                <span className="detail-value">
                                  {rest.phone ? (
                                    <><Phone size={12} /> {rest.phone}</>
                                  ) : (
                                    <span className="text-na">Not provided</span>
                                  )}
                                </span>
                              </div>
                              <div className="expanded-detail">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">
                                  {rest.email ? (
                                    <><Mail size={12} /> {rest.email}</>
                                  ) : (
                                    <span className="text-na">Not provided</span>
                                  )}
                                </span>
                              </div>
                              <div className="expanded-detail">
                                <span className="detail-label">Address</span>
                                <span className="detail-value">
                                  {rest.address ? (
                                    <><MapPin size={12} /> {rest.address}</>
                                  ) : (
                                    <span className="text-na">Not provided</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="expanded-section">
                            <h4>Owner Information</h4>
                            <div className="expanded-details">
                              <div className="expanded-detail">
                                <span className="detail-label">Name</span>
                                <span className="detail-value">
                                  <User size={12} />
                                  {rest.owner?.name || "Unknown"}
                                </span>
                              </div>
                              <div className="expanded-detail">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">
                                  <Mail size={12} />
                                  {rest.owner?.email || "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {rest._count && (
                            <div className="expanded-section">
                              <h4>Statistics</h4>
                              <div className="expanded-stats">
                                <div className="expanded-stat">
                                  <span className="expanded-stat-value">{rest._count.menuItems || 0}</span>
                                  <span className="expanded-stat-label">Menu Items</span>
                                </div>
                                <div className="expanded-stat">
                                  <span className="expanded-stat-value">{rest._count.categories || 0}</span>
                                  <span className="expanded-stat-label">Categories</span>
                                </div>
                                <div className="expanded-stat">
                                  <span className="expanded-stat-value">{rest._count.menuViews || 0}</span>
                                  <span className="expanded-stat-label">Menu Views</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingRestaurant && (
        <div className="modal-overlay" onClick={() => !saving && setEditingRestaurant(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Restaurant</h2>
              <button className="modal-close" onClick={() => setEditingRestaurant(null)} disabled={saving}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Restaurant Name</label>
                <input
                  type="text"
                  value={editingRestaurant.name}
                  onChange={e => setEditingRestaurant({ ...editingRestaurant, name: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div className="form-field">
                <label>Description</label>
                <textarea
                  value={editingRestaurant.description || ""}
                  onChange={e => setEditingRestaurant({ ...editingRestaurant, description: e.target.value })}
                  disabled={saving}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={editingRestaurant.phone || ""}
                    onChange={e => setEditingRestaurant({ ...editingRestaurant, phone: e.target.value })}
                    disabled={saving}
                  />
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editingRestaurant.email || ""}
                    onChange={e => setEditingRestaurant({ ...editingRestaurant, email: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="form-field">
                <label>Plan</label>
                <select
                  value={editingRestaurant.plan}
                  onChange={e => setEditingRestaurant({ ...editingRestaurant, plan: e.target.value })}
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
                  value={editingRestaurant.address || ""}
                  onChange={e => setEditingRestaurant({ ...editingRestaurant, address: e.target.value })}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditingRestaurant(null)} disabled={saving}>
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

      {/* Delete Modal */}
      {deletingRestaurant && (
        <div className="modal-overlay" onClick={() => !saving && setDeletingRestaurant(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <AlertTriangle size={18} className="modal-warning-icon" />
                Delete Restaurant
              </h2>
              <button className="modal-close" onClick={() => setDeletingRestaurant(null)} disabled={saving}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to permanently delete this restaurant?</p>
              <div className="delete-target">
                <strong>{deletingRestaurant.name}</strong>
                <span className="delete-target-type">restaurant</span>
              </div>
              <div className="delete-info">
                <AlertTriangle size={14} />
                <span>This will also delete all menu items, categories, and related data.</span>
              </div>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeletingRestaurant(null)} disabled={saving}>
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