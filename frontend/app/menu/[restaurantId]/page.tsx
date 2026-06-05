"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  MapPin,
  Phone,
  Loader2,
  QrCode,
  Flame,
  UtensilsCrossed,
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
  Heart,
  ChevronUp,
  Coffee,
  Award,
  ChevronLeft,
  ChevronRight,
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
  const restaurantId = params.restaurantId as string;

  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [hasWatermark, setHasWatermark] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>(
    searchParams.get("location") || ""
  );
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const navWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      
      if (navWrapperRef.current) {
        const navTop = navWrapperRef.current.getBoundingClientRect().top;
        setNavScrolled(navTop <= 0);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
        if (data.restaurant.plan === "free" || data.restaurant.plan === "FREE" || !data.restaurant.plan) {
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

  const checkArrows = useCallback(() => {
    if (navContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navContainerRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  }, []);

  useEffect(() => {
    const container = navContainerRef.current;
    if (container) {
      checkArrows();
      container.addEventListener("scroll", checkArrows, { passive: true });
      window.addEventListener("resize", checkArrows);
      return () => {
        container.removeEventListener("scroll", checkArrows);
        window.removeEventListener("resize", checkArrows);
      };
    }
  }, [menuData, checkArrows]);

  const handleLocationChange = (locationId: string) => {
    setSelectedLocation(locationId);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollNav = (direction: "left" | "right") => {
    if (navContainerRef.current) {
      const scrollAmount = 250;
      const newScrollLeft = direction === "left" 
        ? navContainerRef.current.scrollLeft - scrollAmount 
        : navContainerRef.current.scrollLeft + scrollAmount;
      
      navContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  const sortCategoryItems = (items: MenuItem[]): MenuItem[] => {
    return [...items].sort((a, b) => {
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return 0;
    });
  };

  /* ===================================================================
     LOADING STATE
     =================================================================== */

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="menu-loading">
        <div className="menu-loading-spinner">
          <Loader2 size={36} strokeWidth={1.5} className="menu-spin" />
        </div>
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
          <div className="menu-error-icon">
            <QrCode size={24} strokeWidth={1.5} />
          </div>
          <h2>Menu Unavailable</h2>
          <p>{error || "This menu doesn't exist or has been removed."}</p>
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
      items: sortCategoryItems(cat.items),
    })),
    ...(menu.uncategorized.length > 0
      ? [
          {
            id: "other",
            name: "Other Items",
            description: null,
            items: sortCategoryItems(menu.uncategorized),
          },
        ]
      : []),
  ];

  const filteredCategories =
    activeCategory === "all"
      ? allCategories
      : allCategories.filter((cat) => cat.name === activeCategory);

  const hasItems = allCategories.length > 0;

  /* ===================================================================
     RENDER
     =================================================================== */

  return (
    <div className="menu-root">
      <div className="menu-ambient" />
      
      <div className="menu-container">
        <div className="menu-card">
          {/* Header */}
          <header className="menu-header">
            <div className="menu-header-bg" />
            <div className="menu-header-shine" />
            <div className="menu-header-glow" />
            
            <div className="menu-emblem">
              {restaurant.logo ? (
                <img 
                  src={restaurant.logo} 
                  alt={restaurant.name} 
                  className="menu-logo" 
                />
              ) : (
                <div className="menu-monogram">
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                </div>
              )}
            </div>

            <h1 className="menu-title">{restaurant.name}</h1>
            
            <div className="menu-divider">
              <span className="menu-divider-diamond" />
              <span className="menu-divider-line" />
              <span className="menu-divider-diamond" />
            </div>
            
            {restaurant.description && (
              <p className="menu-tagline">{restaurant.description}</p>
            )}
            
            {(restaurant.address || restaurant.phone) && (
              <div className="menu-contact">
                {restaurant.address && (
                  <div className="menu-contact-item">
                    <MapPin size={12} strokeWidth={1.5} />
                    <span>{restaurant.address}</span>
                  </div>
                )}
                {restaurant.phone && (
                  <>
                    {restaurant.address && <span className="menu-contact-separator">•</span>}
                    <div className="menu-contact-item">
                      <Phone size={12} strokeWidth={1.5} />
                      <span>{restaurant.phone}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {showLocationSelector && (
              <div className="menu-location-selector">
                <MapPin size={12} strokeWidth={1.5} />
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
          </header>

          {/* Category Navigation */}
          {hasItems && allCategories.length > 1 && (
            <div 
              ref={navWrapperRef}
              className={`menu-nav-wrapper ${navScrolled ? "menu-nav-shadow" : ""}`}
            >
              {showLeftArrow && (
                <button 
                  className="menu-nav-arrow menu-nav-arrow-left"
                  onClick={() => scrollNav("left")}
                  aria-label="Scroll categories left"
                >
                  <ChevronLeft size={18} strokeWidth={2} />
                </button>
              )}
              
              <div 
                ref={navContainerRef}
                className="menu-nav"
              >
                <button
                  className={`menu-nav-btn ${activeCategory === "all" ? "active" : ""}`}
                  onClick={() => setActiveCategory("all")}
                >
                  <UtensilsCrossed size={14} strokeWidth={1.5} />
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
              </div>

              {showRightArrow && (
                <button 
                  className="menu-nav-arrow menu-nav-arrow-right"
                  onClick={() => scrollNav("right")}
                  aria-label="Scroll categories right"
                >
                  <ChevronRight size={18} strokeWidth={2} />
                </button>
              )}
            </div>
          )}

          {/* Menu Content */}
          <div className="menu-content">
            {hasItems ? (
              filteredCategories.map((cat) => (
                <section key={cat.id} className="menu-section">
                  <div className="menu-section-header">
                    <div className="menu-section-icon">
                      {getCategoryIcon(cat.name)}
                    </div>
                    <div className="menu-section-header-text">
                      <h2 className="menu-section-title">{cat.name}</h2>
                      {cat.description && (
                        <p className="menu-section-subtitle">{cat.description}</p>
                      )}
                    </div>
                    <span className="menu-section-count">{cat.items.length}</span>
                  </div>

                  <div className="menu-items">
                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        className={`menu-item ${item.popular ? "featured" : ""}`}
                      >
                        {item.popular && <div className="menu-item-badge" />}

                        <div className="menu-item-main">
                          <div className="menu-item-header">
                            <h3 className="menu-item-name">{item.name}</h3>
                            <span className="menu-item-dots" />
                            <span className="menu-item-price">
                              Rs. {item.price}
                            </span>
                          </div>
                          
                          {item.description && (
                            <div className="menu-item-desc-row">
                              <p className="menu-item-desc">{item.description}</p>
                            </div>
                          )}
                          
                          {item.popular && (
                            <div className="menu-item-tags">
                              <span className="menu-tag popular">
                                <Flame size={10} />
                                Most Popular
                              </span>
                              <span className="menu-tag special">
                                <Award size={10} />
                                Customer Favorite
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="menu-empty">
                <div className="menu-empty-icon">
                  <UtensilsCrossed size={36} strokeWidth={1} />
                </div>
                <p>No items available yet.</p>
                <span>Check back soon!</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="menu-footer">
            <div className="menu-footer-divider">
              <span className="menu-footer-divider-line" />
              <span className="menu-footer-divider-diamond" />
              <span className="menu-footer-divider-line" />
            </div>
            <div className="menu-footer-ornament">
              <Heart size={16} fill="#C9A96E" color="#C9A96E" />
            </div>
            <p className="menu-footer-text">Thank you for dining with us</p>
            <p className="menu-footer-subtext">We hope to serve you again soon</p>
            
            <div className="menu-footer-powered">
              <QrCode size={12} strokeWidth={1.5} color="#C9A96E" />
              {hasWatermark ? (
                <span>Powered by <strong>EasyMenu</strong></span>
              ) : (
                <span>Powered by <strong>EasyMenu PRO</strong></span>
              )}
            </div>
          </footer>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button 
        className={`menu-scroll-top-btn ${showScrollTop ? "visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <ChevronUp size={20} strokeWidth={2} />
      </button>
    </div>
  );
}