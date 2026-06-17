// admin/app/dashboard/activity/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Filter, X, RefreshCw, ChevronDown, ChevronLeft, ChevronRight,
  Clock, User, Store, CreditCard, Menu, Image, Settings, AlertCircle,
  LogIn, LogOut, UserPlus, Edit, Trash2, CheckCircle, XCircle,
  Key, Mail, QrCode, Upload, Calendar, MapPin, Shield, Activity,
  Eye, Download, SlidersHorizontal
} from "lucide-react";
import "./activity.css";

interface User {
  id: string;
  name: string;
  email: string;
  admin: boolean;
}

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: User | null;
}

interface Filters {
  actions: string[];
  entities: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ENTITY_ICONS: Record<string, any> = {
  USER: User,
  RESTAURANT: Store,
  SUBSCRIPTION: CreditCard,
  MENU_ITEM: Menu,
  CATEGORY: Menu,
  LOCATION: MapPin,
  SCHEDULE: Calendar,
  QR_CODE: QrCode,
  IMAGE: Upload,
  SETTINGS: Settings,
  SYSTEM: Activity,
};

const ACTION_ICONS: Record<string, any> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  SIGNUP: UserPlus,
  GOOGLE_SIGNIN: UserPlus,
  CREATE: Edit,
  UPDATE: Edit,
  DELETE: Trash2,
  APPROVE: CheckCircle,
  REJECT: XCircle,
  PASSWORD_CHANGE: Key,
  PASSWORD_RESET: Key,
  OTP_REQUEST: Mail,
  OTP_VERIFY: Mail,
  PLAN_UPGRADE: CreditCard,
  PLAN_CHANGE: CreditCard,
  QR_GENERATE: QrCode,
  QR_CUSTOMIZE: QrCode,
  IMAGE_UPLOAD: Upload,
  SCHEDULE_CREATE: Calendar,
  SCHEDULE_DELETE: Calendar,
  SCHEDULE_EXECUTE: Calendar,
  LOCATION_CREATE: MapPin,
  LOCATION_UPDATE: MapPin,
  LOCATION_DELETE: MapPin,
  SETTINGS_UPDATE: Settings,
  ADMIN_ACTION: Shield,
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'action-color-green',
  LOGOUT: 'action-color-gray',
  SIGNUP: 'action-color-blue',
  GOOGLE_SIGNIN: 'action-color-blue',
  CREATE: 'action-color-green',
  UPDATE: 'action-color-amber',
  DELETE: 'action-color-red',
  APPROVE: 'action-color-green',
  REJECT: 'action-color-red',
  PASSWORD_CHANGE: 'action-color-amber',
  PASSWORD_RESET: 'action-color-amber',
  OTP_REQUEST: 'action-color-blue',
  OTP_VERIFY: 'action-color-blue',
  PLAN_UPGRADE: 'action-color-violet',
  PLAN_CHANGE: 'action-color-violet',
  QR_GENERATE: 'action-color-blue',
  QR_CUSTOMIZE: 'action-color-blue',
  IMAGE_UPLOAD: 'action-color-green',
  SCHEDULE_CREATE: 'action-color-violet',
  SCHEDULE_DELETE: 'action-color-red',
  SCHEDULE_EXECUTE: 'action-color-green',
  LOCATION_CREATE: 'action-color-green',
  LOCATION_UPDATE: 'action-color-amber',
  LOCATION_DELETE: 'action-color-red',
  SETTINGS_UPDATE: 'action-color-amber',
  ADMIN_ACTION: 'action-color-violet',
};

export default function ActivityLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filters, setFilters] = useState<Filters>({ actions: [], entities: [] });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 50, total: 0, totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Filter states
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const getToken = () => localStorage.getItem("adminToken") || "";

  const fetchLogs = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const params = new URLSearchParams();
      params.set("page", pageNum.toString());
      params.set("limit", pagination.limit.toString());
      
      if (actionFilter !== "ALL") params.set("action", actionFilter);
      if (entityFilter !== "ALL") params.set("entity", entityFilter);
      if (searchQuery) params.set("search", searchQuery);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`${API_URL}/api/admin/activity/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch activity logs");

      const data = await res.json();
      setLogs(data.logs);
      setFilters(data.filters);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, searchQuery, startDate, endDate, pagination.limit]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLogs(newPage);
    }
  };

  const handleClearFilters = () => {
    setActionFilter("ALL");
    setEntityFilter("ALL");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
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

  const getActionIcon = (action: string) => {
    const Icon = ACTION_ICONS[action] || Activity;
    return <Icon size={14} />;
  };

  const getEntityIcon = (entity: string) => {
    const Icon = ENTITY_ICONS[entity] || Activity;
    return <Icon size={12} />;
  };

  const exportToCSV = () => {
    const headers = ["Date", "Action", "Entity", "User", "Description", "IP Address"];
    const rows = logs.map(log => [
      formatDate(log.createdAt),
      log.action,
      log.entity,
      log.user?.name || "System",
      `"${log.description.replace(/"/g, '""')}"`,
      log.ipAddress || "N/A",
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = actionFilter !== "ALL" || entityFilter !== "ALL" || 
    searchQuery || startDate || endDate;

  return (
    <div className="activity-log-page">
      <div className="page-header">
        <div>
          <h1>Activity Logs</h1>
          <p className="page-subtitle">
            Monitor all user and system activities
          </p>
        </div>
        <div className="header-right">
          <button onClick={exportToCSV} className="btn-secondary" disabled={logs.length === 0}>
            <Download size={14} />
            Export CSV
          </button>
          <button onClick={() => fetchLogs(1)} className="btn-secondary" disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
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

      {/* Search and Filters */}
      <div className="activity-filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="search-clear">&times;</button>
          )}
        </div>

        <button 
          className={`btn-secondary ${hasActiveFilters ? 'btn-filter-active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={14} />
          Filters
          {hasActiveFilters && <span className="filter-indicator" />}
        </button>

        {hasActiveFilters && (
          <button onClick={handleClearFilters} className="btn-clear-filters">
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="activity-advanced-filters">
          <div className="filter-row">
            <div className="form-field">
              <label>Action</label>
              <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                <option value="ALL">All Actions</option>
                {filters.actions.map(action => (
                  <option key={action} value={action}>{action.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Entity</label>
              <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
                <option value="ALL">All Entities</option>
                {filters.entities.map(entity => (
                  <option key={entity} value={entity}>{entity.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="activity-stats-bar">
        <div className="activity-stat-item">
          <span className="activity-stat-label">Total Logs</span>
          <span className="activity-stat-value">{pagination.total.toLocaleString()}</span>
        </div>
        <div className="activity-stat-item">
          <span className="activity-stat-label">Page</span>
          <span className="activity-stat-value">{pagination.page} of {pagination.totalPages || 1}</span>
        </div>
        <div className="activity-stat-item">
          <span className="activity-stat-label">Showing</span>
          <span className="activity-stat-value">{logs.length} logs</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="activity-table-container">
        {loading && logs.length === 0 ? (
          <div className="overview-loading">
            <div className="spinner" />
            <p>Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <Activity size={48} />
            <h3>No activity logs found</h3>
            <p>Activity logs will appear here as users interact with the system.</p>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className="btn-clear-filters-center" style={{ marginTop: 16 }}>
                <X size={16} />
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="activity-table-wrapper">
            <table className="activity-table">
              <thead>
                <tr>
                  <th style={{ width: 180 }}>Date & Time</th>
                  <th style={{ width: 120 }}>Action</th>
                  <th style={{ width: 100 }}>Entity</th>
                  <th style={{ width: 150 }}>User</th>
                  <th>Description</th>
                  <th style={{ width: 120 }}>IP Address</th>
                  <th style={{ width: 60 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="activity-row">
                    <td className="activity-date">
                      <Clock size={12} />
                      <span>{formatDate(log.createdAt)}</span>
                    </td>
                    <td>
                      <span className={`activity-badge ${ACTION_COLORS[log.action] || 'action-color-gray'}`}>
                        {getActionIcon(log.action)}
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <span className="activity-entity">
                        {getEntityIcon(log.entity)}
                        {log.entity.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      {log.user ? (
                        <div className="activity-user">
                          <div className="activity-user-avatar">
                            {log.user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="activity-user-info">
                            <span className="activity-user-name">{log.user.name}</span>
                            <span className="activity-user-email">{log.user.email}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="activity-system">System</span>
                      )}
                    </td>
                    <td className="activity-description">{log.description}</td>
                    <td>
                      <code className="activity-ip">{log.ipAddress || "N/A"}</code>
                    </td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => setSelectedLog(log)}
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="btn-page"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          
          <div className="pagination-info">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(p => {
                if (pagination.totalPages <= 7) return true;
                if (p === 1 || p === pagination.totalPages) return true;
                if (Math.abs(p - pagination.page) <= 1) return true;
                return false;
              })
              .map((p, i, arr) => (
                <span key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="pagination-dots">...</span>}
                  <button
                    onClick={() => handlePageChange(p)}
                    className={`btn-page-num ${p === pagination.page ? 'active' : ''}`}
                  >
                    {p}
                  </button>
                </span>
              ))}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="btn-page"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Log Details</h2>
              <button onClick={() => setSelectedLog(null)} className="modal-close">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="log-detail-grid">
                <div className="log-detail-item">
                  <label>Action</label>
                  <span className={`activity-badge ${ACTION_COLORS[selectedLog.action] || ''}`}>
                    {getActionIcon(selectedLog.action)}
                    {selectedLog.action.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="log-detail-item">
                  <label>Entity</label>
                  <span className="activity-entity">
                    {getEntityIcon(selectedLog.entity)}
                    {selectedLog.entity.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="log-detail-item">
                  <label>Date & Time</label>
                  <span>{formatDate(selectedLog.createdAt)}</span>
                </div>
                <div className="log-detail-item">
                  <label>User</label>
                  <span>{selectedLog.user?.name || "System"}</span>
                </div>
                <div className="log-detail-item">
                  <label>Email</label>
                  <span>{selectedLog.user?.email || "N/A"}</span>
                </div>
                <div className="log-detail-item">
                  <label>Entity ID</label>
                  <code>{selectedLog.entityId || "N/A"}</code>
                </div>
                <div className="log-detail-item log-detail-full">
                  <label>Description</label>
                  <p>{selectedLog.description}</p>
                </div>
                {selectedLog.ipAddress && (
                  <div className="log-detail-item">
                    <label>IP Address</label>
                    <code>{selectedLog.ipAddress}</code>
                  </div>
                )}
                {selectedLog.userAgent && (
                  <div className="log-detail-item">
                    <label>User Agent</label>
                    <code className="log-detail-ua">{selectedLog.userAgent}</code>
                  </div>
                )}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="log-detail-item log-detail-full">
                    <label>Metadata</label>
                    <pre className="log-detail-metadata">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}