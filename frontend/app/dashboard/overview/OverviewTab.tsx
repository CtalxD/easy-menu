//frontend/app/dashboard/overview/OverviewTab.tsx
"use client";

import { Utensils, LayoutDashboard, MapPin, Crown, ArrowRight, Edit3, Calendar, Clock, CreditCard, BadgeCheck, AlertCircle, Package } from "lucide-react";
import "./overview.css";

interface OverviewTabProps {
  user: any;
  planInfo: any;
  menuItems: any[];
  categories: any[];
  locations: any[];
  isProOrAbove: boolean;
  isSubscribed: boolean;
  isExpired: boolean;
  subscription: any;
  navigateToMembership: () => void;
  openEditItem: (item: any) => void;
}

export default function OverviewTab({
  user,
  planInfo,
  menuItems,
  categories,
  locations,
  isProOrAbove,
  isSubscribed,
  isExpired,
  subscription,
  navigateToMembership,
  openEditItem,
}: OverviewTabProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getProgressPercent = () => {
    if (!subscription) return 0;
    const startDate = new Date(subscription.startDate);
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'STARTER': return '#6A8C78';
      case 'PRO': return 'var(--terra)';
      case 'ENTERPRISE': return '#A8874A';
      default: return 'var(--ink-muted)';
    }
  };

  const stats = [
    { label: "Menu Items", value: `${menuItems.length}/${planInfo.itemLimit}`, icon: <Utensils size={18} />, trend: `${Math.max(0, planInfo.itemLimit - menuItems.length)} remaining`, isLimitReached: menuItems.length >= planInfo.itemLimit },
    { label: "Categories", value: `${categories.length}/${planInfo.categoryLimit}`, icon: <LayoutDashboard size={18} />, trend: `${Math.max(0, planInfo.categoryLimit - categories.length)} remaining`, isLimitReached: categories.length >= planInfo.categoryLimit },
    { label: "Locations", value: `${locations.length}${isProOrAbove ? `/5` : ''}`, icon: <MapPin size={18} />, trend: isProOrAbove ? `${Math.max(0, 5 - locations.length)} available` : 'Pro feature', isLimitReached: false },
    { label: "Current Plan", value: planInfo.plan.charAt(0).toUpperCase() + planInfo.plan.slice(1).toLowerCase(), icon: <Crown size={18} />, trend: isSubscribed ? `${subscription.daysRemaining} days left` : planInfo.isFree ? "Free Plan" : "Active", isLimitReached: false },
  ];

  return (
    <div className="overview-tab">
      <div className="dash-welcome">
        <h1>Welcome back, {user.restaurant?.name || user.name}</h1>
        <p>Here&apos;s what&apos;s happening with your menu today.</p>
      </div>

      {isSubscribed && (
        <div className="dash-subscription-card">
          <div className="dash-subscription-header">
            <div className="dash-subscription-plan-badge">
              <div className="dash-subscription-plan-icon" style={{ background: getPlanColor(subscription.plan) }}>
                <Crown size={20} color="white" />
              </div>
              <div>
                <span className="dash-subscription-plan-name">{subscription.plan.charAt(0) + subscription.plan.slice(1).toLowerCase()} Plan</span>
                <span className="dash-subscription-plan-price">${subscription.price}/{subscription.billingCycle.toLowerCase()}</span>
              </div>
            </div>
            <div className="dash-subscription-status active"><BadgeCheck size={14} /> Active</div>
          </div>
          <div className="dash-subscription-body">
            <div className="dash-subscription-info">
              <div className="dash-subscription-stat"><span className="dash-subscription-label"><Clock size={12} />Days</span><span className="dash-subscription-value days">{subscription.daysRemaining}</span></div>
              <div className="dash-subscription-stat"><span className="dash-subscription-label"><Calendar size={12} />Start</span><span className="dash-subscription-value">{formatDate(subscription.startDate)}</span></div>
              <div className="dash-subscription-stat"><span className="dash-subscription-label"><Calendar size={12} />Renews</span><span className="dash-subscription-value">{formatDate(subscription.endDate)}</span></div>
              <div className="dash-subscription-stat"><span className="dash-subscription-label"><CreditCard size={12} />Billing</span><span className="dash-subscription-value">{subscription.billingCycle.toLowerCase()}</span></div>
            </div>
            <div className="dash-subscription-progress">
              <div className="dash-subscription-progress-header"><span>Progress</span><span>{Math.round(getProgressPercent())}%</span></div>
              <div className="dash-subscription-progress-bar"><div className="dash-subscription-progress-fill" style={{ width: `${getProgressPercent()}%` }} /></div>
            </div>
            <div className="dash-subscription-actions">
              <button className="dash-btn-secondary" onClick={navigateToMembership} type="button">Manage</button>
              {planInfo.plan !== 'PRO' && planInfo.plan !== 'ENTERPRISE' && (
                <button className="dash-btn-primary" onClick={navigateToMembership} type="button"><Crown size={14} /> Upgrade</button>
              )}
            </div>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="dash-subscription-card expired">
          <div className="dash-subscription-header">
            <div className="dash-subscription-plan-badge">
              <div className="dash-subscription-plan-icon" style={{ background: 'var(--red)' }}><AlertCircle size={20} color="white" /></div>
              <div><span className="dash-subscription-plan-name">Expired</span><span className="dash-subscription-plan-price">{subscription.plan.toLowerCase()} plan ended</span></div>
            </div>
            <div className="dash-subscription-status expired">Expired</div>
          </div>
          <div className="dash-subscription-body">
            <div className="dash-subscription-expired-info">
              <div className="dash-subscription-stat"><span className="dash-subscription-label">Plan</span><span className="dash-subscription-value">{subscription.plan.toLowerCase()}</span></div>
              <div className="dash-subscription-stat"><span className="dash-subscription-label">Expired</span><span className="dash-subscription-value">{formatDate(subscription.endDate)}</span></div>
            </div>
            <p className="dash-subscription-expired-text">Premium features unavailable. Renew now.</p>
            <button className="dash-btn-primary" onClick={navigateToMembership} type="button"><Crown size={16} /> Renew Now</button>
          </div>
        </div>
      )}

      {planInfo.isFree && (
        <div className="dash-subscription-card free">
          <div className="dash-subscription-header">
            <div className="dash-subscription-plan-badge">
              <div className="dash-subscription-plan-icon" style={{ background: 'var(--ink-muted)' }}>
                <Package size={20} color="white" />
              </div>
              <div>
                <span className="dash-subscription-plan-name">Free Plan</span>
                <span className="dash-subscription-plan-price">Limited features</span>
              </div>
            </div>
            <div className="dash-subscription-status free">Current</div>
          </div>
          <div className="dash-subscription-body">
            <div className="dash-subscription-free-limits">
              <div className="dash-subscription-free-limit">
                <Utensils size={14} />
                <div>
                  <span className="dash-subscription-free-limit-value">{menuItems.length}/{planInfo.itemLimit}</span>
                  <span className="dash-subscription-free-limit-label">Menu Items</span>
                </div>
              </div>
              <div className="dash-subscription-free-limit">
                <LayoutDashboard size={14} />
                <div>
                  <span className="dash-subscription-free-limit-value">{categories.length}/{planInfo.categoryLimit}</span>
                  <span className="dash-subscription-free-limit-label">Categories</span>
                </div>
              </div>
              <div className="dash-subscription-free-limit">
                <MapPin size={14} />
                <div>
                  <span className="dash-subscription-free-limit-value">1</span>
                  <span className="dash-subscription-free-limit-label">Location</span>
                </div>
              </div>
            </div>
            <p className="dash-subscription-free-text">
              Upgrade to unlock more items, categories, locations, QR customization, and analytics.
            </p>
            <button className="dash-btn-upgrade" onClick={navigateToMembership} type="button" style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: '14px' }}>
              <Crown size={16} /> View Plans <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="dash-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="dash-stat-card" style={{ borderColor: stat.isLimitReached ? '#E53935' : undefined }}>
            <div className="dash-stat-icon-wrap">{stat.icon}</div>
            <div className="dash-stat-value" style={{ color: stat.isLimitReached ? '#E53935' : undefined }}>{stat.value}</div>
            <div className="dash-stat-label">{stat.label}</div>
            <div className="dash-stat-trend" style={{ color: stat.isLimitReached ? '#E53935' : undefined }}>{stat.trend}</div>
          </div>
        ))}
      </div>

      <div className="dash-section">
        <div className="dash-section-header">
          <h2 className="dash-section-title">Recent Items</h2>
          <button className="dash-view-all" onClick={() => window.dispatchEvent(new CustomEvent('dashboard-tab-change', { detail: 'menu' }))} type="button">View all <ArrowRight size={14} /></button>
        </div>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {menuItems.slice(0, 5).map((item: any) => (
                <tr key={item.id}>
                  <td><div className="dash-item-name-cell">{item.popular && <span className="dash-badge-popular">Popular</span>}{item.name}</div></td>
                  <td>{item.category?.name || "---"}</td>
                  <td className="dash-price-cell">NPR {item.price}</td>
                  <td><span className={`dash-status ${item.status}`}>{item.status === "available" ? "Available" : "Sold Out"}</span></td>
                  <td><button className="dash-more-btn" onClick={() => openEditItem(item)} type="button"><Edit3 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}