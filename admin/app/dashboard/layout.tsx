"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Shield, LogOut, Users, Building2, CreditCard, LayoutDashboard } from "lucide-react";
import "./layout.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminRestaurantId");
    localStorage.removeItem("adminRestaurantName");
    localStorage.removeItem("adminRestaurantPlan");
    router.push("/login");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  const closeSidebar = () => setSidebarOpen(false);

  if (!adminUser) {
    return (
      <div className="dashboard-loading">
        <p>Verifying credentials...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Shield size={22} />
          </div>
          <div className="sidebar-brand">
            <h2>EasyMenu</h2>
            <span>Staff Panel</span>
          </div>
          <button className="sidebar-close" onClick={closeSidebar}>
            &times;
          </button>
        </div>

        <nav className="sidebar-nav">
          <a 
            href="/dashboard" 
            className={`nav-item ${pathname === "/dashboard" ? "active" : ""}`}
            onClick={closeSidebar}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </a>
          <a 
            href="/dashboard/users" 
            className={`nav-item ${isActive("/dashboard/users") ? "active" : ""}`}
            onClick={closeSidebar}
          >
            <Users size={18} />
            <span>Users</span>
          </a>
          <a 
            href="/dashboard/restaurants" 
            className={`nav-item ${isActive("/dashboard/restaurants") ? "active" : ""}`}
            onClick={closeSidebar}
          >
            <Building2 size={18} />
            <span>Restaurants</span>
          </a>
          <a 
            href="/dashboard/subscriptions" 
            className={`nav-item ${isActive("/dashboard/subscriptions") ? "active" : ""}`}
            onClick={closeSidebar}
          >
            <CreditCard size={18} />
            <span>Subscriptions</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <span className="admin-name">{adminUser?.name}</span>
            <span className="admin-email">{adminUser?.email}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Mobile header */}
        <div className="mobile-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <span className="menu-bar" />
            <span className="menu-bar" />
            <span className="menu-bar" />
          </button>
          <span className="mobile-title">EasyMenu Staff Panel</span>
        </div>

        {children}
      </main>
    </div>
  );
}