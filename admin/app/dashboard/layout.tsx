//admin/app/dashboard/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Shield, LogOut, CreditCard, Users, LayoutDashboard, Store
} from "lucide-react";
import "./layout.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    fetchPendingCount(token);

    // Refresh pending count every 30 seconds
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem("adminToken") || token;
      fetchPendingCount(currentToken);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchPendingCount = async (token: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/admin/subscriptions/pending`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.length);
      }
    } catch (error) {
      console.error("Failed to fetch pending count:", error);
    }
  };

  const handleLogout = () => {
    ["adminToken", "adminUser", "adminRestaurantId", "adminRestaurantName"].forEach(
      key => localStorage.removeItem(key)
    );
    router.push("/login");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(path);
  };

  const navItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Overview",
      exact: true,
    },
    {
      href: "/dashboard/users",
      icon: Users,
      label: "Users",
    },
    {
      href: "/dashboard/restaurants",
      icon: Store,
      label: "Restaurants",
    },
    {
      href: "/dashboard/subscriptions",
      icon: CreditCard,
      label: "Subscriptions",
      badge: pendingCount,
    },
  ];

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {!sidebarCollapsed && window.innerWidth < 768 && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <aside className={`admin-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-brand">
          <Link href="/dashboard" className="brand-link">
            <div className="brand-icon">
              <Shield size={20} />
            </div>
            {!sidebarCollapsed && <span className="brand-name">EasyMenu</span>}
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive(item.href) ? "active" : ""}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon size={18} />
              {!sidebarCollapsed && <span>{item.label}</span>}
              {item.badge && item.badge > 0 && (
                <span className="nav-badge">
                  {sidebarCollapsed ? "" : item.badge}
                  {sidebarCollapsed && item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {adminUser?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="sidebar-user-info">
                <p className="sidebar-user-name">{adminUser?.name || "Admin"}</p>
                <p className="sidebar-user-role">Administrator</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="btn-logout" title="Logout">
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}