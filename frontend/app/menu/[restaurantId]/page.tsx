// frontend/app/menu/[restaurantId]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  MapPin,
  Phone,
  Loader2,
  QrCode,
  Flame,
  Crown,
  UtensilsCrossed,
  Coffee,
  Soup,
  Salad,
  Cake,
  Wine,
  Beef,
  Croissant,
  IceCream,
  GlassWater,
  Beer,
  Apple,
  ChefHat,
  Plus,
  ChevronDown,
} from "lucide-react";
import "./menu.css";

/* ===================================================================
   TYPES
   =================================================================== */

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  plan: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  popular: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  items: MenuItem[];
}

interface LocationOption {
  id: string;
  name: string;
  address: string | null;
}

interface MenuData {
  restaurant: Restaurant;
  locations: LocationOption[];
  menu: {
    categories: Category[];
    uncategorized: MenuItem[];
  };
}

/* ===================================================================
   CATEGORY ICONS
   =================================================================== */

const categoryIcons: Record<string, React.ReactNode> = {
  Appetizers: <Salad size={14} strokeWidth={1.5} />,
  Soups: <Soup size={14} strokeWidth={1.5} />,
  Salads: <Apple size={14} strokeWidth={1.5} />,
  "Main Course": <UtensilsCrossed size={14} strokeWidth={1.5} />,
  Lunch: <Beef size={14} strokeWidth={1.5} />,
  Dinner: <ChefHat size={14} strokeWidth={1.5} />,
  Brunch: <Croissant size={14} strokeWidth={1.5} />,
  Sides: <Plus size={14} strokeWidth={1.5} />,
  Desserts: <Cake size={14} strokeWidth={1.5} />,
  "Ice Cream": <IceCream size={14} strokeWidth={1.5} />,
  "Hot Drinks": <Coffee size={14} strokeWidth={1.5} />,
  "Cold Drinks": <GlassWater size={14} strokeWidth={1.5} />,
  "Soft Drinks": <GlassWater size={14} strokeWidth={1.5} />,
  "Hard Drinks": <Wine size={14} strokeWidth={1.5} />,
  Beer: <Beer size={14} strokeWidth={1.5} />,
  Wine: <Wine size={14} strokeWidth={1.5} />,
  Cocktails: <Wine size={14} strokeWidth={1.5} />,
  Mocktails: <GlassWater size={14} strokeWidth={1.5} />,
};

const getCategoryIcon = (name: string): React.ReactNode => {
  return categoryIcons[name] || <UtensilsCrossed size={14} strokeWidth={1.5} />;
};

/* ===================================================================
   CONSTANTS
   =================================================================== */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ===================================================================
   MAIN COMPONENT
   =================================================================== */

export default function PublicMenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const restaurantId = params.restaurantId as string;

  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [hasWatermark, setHasWatermark] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>(
    searchParams.get("location") || ""
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!restaurantId) return;
      setLoading(true);
      setError("");
      try {
        let url = `${API_URL}/api/public/menu/${restaurantId}`;
        if (selectedLocation) {
          url += `?location=${selectedLocation}`;
        }
        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Restaurant not found");
          throw new Error("Failed to load menu");
        }
        const data = await res.json();
        setMenuData(data);
        if (data.restaurant.plan === "free" || !data.restaurant.plan) {
          setHasWatermark(true);
        } else {
          setHasWatermark(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load menu.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [restaurantId, selectedLocation]);

  const handleLocationChange = (locationId: string) => {
    setSelectedLocation(locationId);
  };

  /* ===================================================================
     LOADING STATE
     =================================================================== */

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="menu-loading">
        <Loader2 size={36} strokeWidth={1.5} className="menu-spin" />
        <p>Preparing your menu...</p>
      </div>
    );
  }

  /* ===================================================================
     ERROR STATE
     =================================================================== */

  if (error || !menuData) {
    return (
      <div className="menu-error">
        <div className="menu-error-card">
          <QrCode size={32} strokeWidth={1.5} />
          <h2>Menu Unavailable</h2>
          <p>{error || "This menu doesn't exist or has been removed."}</p>
          <Link href="/">Go to EasyMenu</Link>
        </div>
      </div>
    );
  }

  /* ===================================================================
     DATA
     =================================================================== */

  const { restaurant, locations, menu } = menuData;
  const isPaidPlan = restaurant.plan !== 'free' && restaurant.plan !== 'FREE';
  const showLocationSelector = isPaidPlan && locations && locations.length > 0;

  const allCategories = [
    ...menu.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      items: cat.items,
    })),
    ...(menu.uncategorized.length > 0
      ? [
          {
            id: "other",
            name: "Other Items",
            description: null,
            items: menu.uncategorized,
          },
        ]
      : []),
  ];

  const filteredCategories =
    activeCategory === "all"
      ? allCategories
      : allCategories.filter((cat) => cat.name === activeCategory);

  const hasItems = allCategories.length > 0;

  const selectedLocationName = selectedLocation
    ? locations.find((l) => l.id === selectedLocation)?.name || "All Locations"
    : "All Locations";

  /* ===================================================================
     RENDER
     =================================================================== */

  return (
    <div className="menu-root">
      <div className="menu-container">
        <div className="menu-paper">
          {/* Paper Effects */}
          <div className="menu-paper-grain"></div>
          <div className="menu-paper-stain"></div>
          <div className="menu-paper-stain-2"></div>
          <div className="menu-paper-fold"></div>

          {/* ================================================================ */}
          {/* HEADER                                                            */}
          {/* ================================================================ */}
          <header className="menu-header">
            <div className="menu-header-icons">
              <Crown size={20} strokeWidth={1.5} />
            </div>
            <h1 className="menu-title">{restaurant.name}</h1>
            <div className="menu-subtitle">
              <Star size={10} fill="#C45E3A" color="#C45E3A" />
              <span>DIGITAL MENU</span>
              <Star size={10} fill="#C45E3A" color="#C45E3A" />
            </div>

            {restaurant.address && (
              <p className="menu-info">
                <MapPin size={11} strokeWidth={1.5} />
                {restaurant.address}
              </p>
            )}
            {restaurant.phone && (
              <p className="menu-info">
                <Phone size={11} strokeWidth={1.5} />
                {restaurant.phone}
              </p>
            )}

            {restaurant.description && (
              <p className="menu-desc">{restaurant.description}</p>
            )}

            {/* Location Selector */}
            {showLocationSelector && (
              <div className="menu-location-selector">
                <MapPin size={13} strokeWidth={1.5} />
                <select
                  value={selectedLocation}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="menu-location-dropdown"
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}{loc.address ? ` — ${loc.address}` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} strokeWidth={1.5} className="menu-location-chevron" />
              </div>
            )}

            {/* Show selected location for paid plans */}
            {isPaidPlan && selectedLocation && (
              <p className="menu-location-label">
                <MapPin size={10} strokeWidth={1.5} />
                Showing menu for: <strong>{selectedLocationName}</strong>
              </p>
            )}

            <div className="menu-header-line">
              <span>✦ ✦ ✦</span>
            </div>
          </header>

          {/* ================================================================ */}
          {/* CATEGORY NAVIGATION                                               */}
          {/* ================================================================ */}
          {hasItems && allCategories.length > 1 && (
            <nav className="menu-nav">
              <button
                className={`menu-nav-btn ${activeCategory === "all" ? "active" : ""}`}
                onClick={() => setActiveCategory("all")}
              >
                <Flame size={12} strokeWidth={1.5} />
                <span>Full Menu</span>
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat.id}
                  className={`menu-nav-btn ${activeCategory === cat.name ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat.name)}
                >
                  {getCategoryIcon(cat.name)}
                  <span>{cat.name}</span>
                </button>
              ))}
            </nav>
          )}

          {/* ================================================================ */}
          {/* MENU CONTENT                                                      */}
          {/* ================================================================ */}
          <main className="menu-body">
            {hasItems ? (
              filteredCategories.map((cat) => (
                <section key={cat.id} className="menu-section">
                  <div className="menu-section-head">
                    <div className="menu-section-icon">
                      {getCategoryIcon(cat.name)}
                    </div>
                    <h2 className="menu-section-title">{cat.name}</h2>
                    <div className="menu-section-line"></div>
                    <span className="menu-section-count">
                      {cat.items.length}
                    </span>
                  </div>

                  {cat.description && (
                    <p className="menu-section-desc">{cat.description}</p>
                  )}

                  <div className="menu-items">
                    {cat.items.map((item) => (
                      <div key={item.id} className="menu-item">
                        <div className="menu-item-content">
                          <div className="menu-item-top">
                            {item.popular && (
                              <Flame size={10} className="menu-popular-icon" />
                            )}
                            <h3>{item.name}</h3>
                            {item.popular && (
                              <span className="menu-badge">Popular</span>
                            )}
                          </div>
                          {item.description && (
                            <p className="menu-item-desc">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="menu-price">Rs. {item.price}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="menu-empty">
                <Coffee size={40} strokeWidth={1} />
                <p>No items available yet. Check back soon!</p>
              </div>
            )}
          </main>

          {/* ================================================================ */}
          {/* FOOTER                                                            */}
          {/* ================================================================ */}
          <footer className="menu-footer">
            <div className="menu-header-line">
              <span>✦ ✦ ✦</span>
            </div>
            <p className="menu-thanks">Thank you for dining with us!</p>

            {hasWatermark ? (
              <div className="menu-watermark">
                <QrCode size={12} strokeWidth={2} />
                <span>
                  Powered by <strong>EasyMenu</strong>
                </span>
                <span className="menu-watermark-divider">•</span>
                <span>Get your own digital menu at easymenu.com</span>
              </div>
            ) : (
              <p className="menu-brand">
                <QrCode size={10} strokeWidth={2} />
                Powered by EasyMenu
              </p>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}