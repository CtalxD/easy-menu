"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, Calendar, QrCode, Star, Smartphone, Monitor, Tablet, FileDown, Crown, ArrowRight, Loader2 } from "lucide-react";
import "./analytics.css";

interface AnalyticsTabProps {
  planInfo: any;
  isProOrAbove: boolean;
  locations: any[];
  getAccessToken: () => string | null;
  addToast: (type: "success" | "error" | "info", message: string, action?: { label: string; href: string }) => void;
  navigateToMembership: () => void;
  API_URL: string;
}

export default function AnalyticsTab({
  planInfo,
  isProOrAbove,
  locations,
  getAccessToken,
  addToast,
  navigateToMembership,
  API_URL,
}: AnalyticsTabProps) {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsLocationFilter, setAnalyticsLocationFilter] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const token = getAccessToken();
      if (!token) return;
      let url = `${API_URL}/api/menu/analytics`;
      if (analyticsLocationFilter) url += `?locationId=${analyticsLocationFilter}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        setAnalyticsData(await response.json());
      } else if (response.status === 403) {
        setAnalyticsData(null);
      }
    } catch (err) { console.error("fetchAnalytics error:", err); }
    finally { setAnalyticsLoading(false); }
  }, [getAccessToken, API_URL, analyticsLocationFilter]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handleExportCSV = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;
      let url = `${API_URL}/api/menu/analytics/export`;
      if (analyticsLocationFilter) url += `?locationId=${analyticsLocationFilter}`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        addToast("success", "CSV exported!");
      } else if (response.status === 403) {
        addToast("error", "CSV export is Pro only.", { label: "Upgrade", href: "/membership" });
      }
    } catch { addToast("error", "Failed"); }
  };

  if (planInfo.isFree) {
    return (
      <div className="analytics-tab">
        <div className="dash-analytics-upgrade">
          <div className="dash-analytics-upgrade-card">
            <div className="dash-analytics-upgrade-icon"><BarChart3 size={48} /></div>
            <h1 className="dash-page-title">Analytics</h1>
            <p className="dash-page-desc">Available on <strong>Starter</strong> and above.</p>
            <div className="dash-analytics-upgrade-features">
              <div className="dash-analytics-feature"><BarChart3 size={16} /><span>View counts</span></div>
              <div className="dash-analytics-feature"><Star size={16} /><span>Popular items</span></div>
              <div className="dash-analytics-feature"><TrendingUp size={16} /><span>Advanced trends (Pro)</span></div>
            </div>
            <button className="dash-btn-upgrade" onClick={navigateToMembership} type="button"><Crown size={16} /> Upgrade <ArrowRight size={16} /></button>
          </div>
        </div>
      </div>
    );
  }

  if (analyticsLoading) {
    return (
      <div className="analytics-tab">
        <div className="dash-qr-loading" style={{ padding: '60px 0' }}>
          <Loader2 size={40} className="spinning" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-tab">
        <div className="dash-empty-state">
          <BarChart3 size={48} />
          <h3>No data yet</h3>
          <p>Analytics appear once customers view your menu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-tab">
      <div className="dash-welcome">
        <div className="dash-section-header">
          <div>
            <h1>Analytics</h1>
            <p>Track menu interactions.</p>
          </div>
          <div className="dash-analytics-actions">
            {locations.length > 0 && (
              <select value={analyticsLocationFilter} onChange={(e) => setAnalyticsLocationFilter(e.target.value)} className="dash-form-input" style={{ width: 'auto', minWidth: '160px' }}>
                <option value="">All Locations</option>
                {locations.map((loc: any) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            )}
            {isProOrAbove && (
              <button className="dash-btn-secondary" onClick={handleExportCSV} type="button"><FileDown size={16} /> Export CSV</button>
            )}
          </div>
        </div>
      </div>

      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-icon-wrap"><BarChart3 size={18} /></div>
          <div className="dash-stat-value">{analyticsData.overview.totalViews}</div>
          <div className="dash-stat-label">Total Views</div>
          <div className="dash-stat-trend">All time</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon-wrap"><QrCode size={18} /></div>
          <div className="dash-stat-value">{analyticsData.overview.todayViews}</div>
          <div className="dash-stat-label">Today</div>
          <div className="dash-stat-trend">Scans</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon-wrap"><TrendingUp size={18} /></div>
          <div className="dash-stat-value">{analyticsData.overview.weekViews}</div>
          <div className="dash-stat-label">This Week</div>
          <div className="dash-stat-trend">7 days</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon-wrap"><Calendar size={18} /></div>
          <div className="dash-stat-value">{analyticsData.overview.monthViews}</div>
          <div className="dash-stat-label">This Month</div>
          <div className="dash-stat-trend">30 days</div>
        </div>
      </div>

      {analyticsData.deviceBreakdown && (
        <div className="dash-section">
          <div className="dash-section-header"><h2 className="dash-section-title">Devices</h2></div>
          <div className="dash-device-grid">
            <div className="dash-device-card"><Smartphone size={20} /><div className="dash-device-value">{analyticsData.deviceBreakdown.MOBILE}</div><div className="dash-device-label">Mobile</div></div>
            <div className="dash-device-card"><Tablet size={20} /><div className="dash-device-value">{analyticsData.deviceBreakdown.TABLET}</div><div className="dash-device-label">Tablet</div></div>
            <div className="dash-device-card"><Monitor size={20} /><div className="dash-device-value">{analyticsData.deviceBreakdown.DESKTOP}</div><div className="dash-device-label">Desktop</div></div>
          </div>
        </div>
      )}

      <div className="dash-section">
        <div className="dash-section-header"><h2 className="dash-section-title">Last 7 Days</h2></div>
        <div className="dash-analytics-chart">
          <div className="dash-analytics-bars">
            {Object.entries(analyticsData.dailyBreakdown).map(([date, count]: [string, any]) => {
              const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
              const maxVal = Math.max(...(Object.values(analyticsData.dailyBreakdown) as number[]), 1);
              const height = ((count as number) / maxVal) * 100;
              return (
                <div key={date} className="dash-analytics-bar-item">
                  <div className="dash-analytics-bar-wrap">
                    <div className="dash-analytics-bar" style={{ height: `${Math.max(height, 4)}%` }}>
                      <span className="dash-analytics-bar-value">{String(count)}</span>
                    </div>
                  </div>
                  <span className="dash-analytics-bar-label">{dayName}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {analyticsData.hourlyBreakdown && (
        <div className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">Peak Hours <span className="dash-badge-popular" style={{ marginLeft: '8px' }}>Pro</span></h2>
          </div>
          <div className="dash-analytics-chart">
            <div className="dash-analytics-bars dash-analytics-bars-compact">
              {Object.entries(analyticsData.hourlyBreakdown).map(([hour, count]: [string, any]) => {
                const maxVal = Math.max(...(Object.values(analyticsData.hourlyBreakdown!) as number[]), 1);
                const height = ((count as number) / maxVal) * 100;
                return (
                  <div key={hour} className="dash-analytics-bar-item dash-analytics-bar-item-compact">
                    <div className="dash-analytics-bar-wrap">
                      <div className="dash-analytics-bar dash-analytics-bar-pro" style={{ height: `${Math.max(height, 3)}%` }} />
                    </div>
                    <span className="dash-analytics-bar-label">{`${hour.padStart(2, '0')}:00`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {analyticsData.categoryPopularity && (
        <div className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">Categories <span className="dash-badge-popular" style={{ marginLeft: '8px' }}>Pro</span></h2>
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead><tr><th>Category</th><th>Items</th></tr></thead>
              <tbody>
                {analyticsData.categoryPopularity.map((cat: any, i: number) => (
                  <tr key={i}><td className="feature-name">{cat.name}</td><td>{cat.itemCount}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analyticsData.monthlyBreakdown && (
        <div className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">30 Days <span className="dash-badge-popular" style={{ marginLeft: '8px' }}>Pro</span></h2>
          </div>
          <div className="dash-analytics-chart">
            <div className="dash-analytics-bars dash-analytics-bars-compact">
              {Object.entries(analyticsData.monthlyBreakdown).map(([date, count]: [string, any]) => {
                const dayNum = new Date(date).getDate();
                const maxVal = Math.max(...(Object.values(analyticsData.monthlyBreakdown!) as number[]), 1);
                const height = ((count as number) / maxVal) * 100;
                return (
                  <div key={date} className="dash-analytics-bar-item dash-analytics-bar-item-compact">
                    <div className="dash-analytics-bar-wrap">
                      <div className="dash-analytics-bar dash-analytics-bar-pro" style={{ height: `${Math.max(height, 3)}%` }} />
                    </div>
                    <span className="dash-analytics-bar-label">{dayNum}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {analyticsData.popularItems.length > 0 && (
        <div className="dash-section">
          <div className="dash-section-header"><h2 className="dash-section-title">Popular Items</h2></div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead><tr><th>Item</th><th>Price</th><th>Status</th></tr></thead>
              <tbody>
                {analyticsData.popularItems.map((item: any) => (
                  <tr key={item.id}>
                    <td><div className="dash-item-name-cell"><span className="dash-badge-popular">Popular</span>{item.name}</div></td>
                    <td className="dash-price-cell">NPR {item.price}</td>
                    <td><span className={`dash-status ${item.status}`}>{item.status === "available" ? "Available" : "Sold Out"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}