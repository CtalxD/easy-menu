"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  QrCode,
  Flame,
  ArrowLeft,
  Heart,
  Award,
  Clock,
  UtensilsCrossed,
  Soup,
  ChefHat,
  Coffee,
  Cake,
  Croissant,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Salad,
  Eye,
  X,
} from "lucide-react";
import "./demo.css";

/* ===================================================================
   DATA
   =================================================================== */

interface DemoItem {
  id: string;
  name: string;
  description: string;
  price: number;
  popular: boolean;
  soldOut: boolean;
  imageUrl: string;
}

interface DemoCategory {
  id: string;
  name: string;
  subtitle?: string;
  icon: React.ReactNode;
  items: DemoItem[];
}

const demoRestaurant = {
  name: "The Orange Cafe",
  initials: "OC",
  tagline: "Handcrafted comfort food & specialty coffee",
  address: "Lakeside, Pokhara",
  phone: "+977 9841000000",
  established: "2020",
  logoUrl: null,
};

const demoCategories: DemoCategory[] = [
  {
    id: "starters",
    name: "Starters",
    subtitle: "Begin your culinary journey",
    icon: <Salad size={16} strokeWidth={1.5} />,
    items: [
      { id: "s1", name: "Buff Momo", description: "Handcrafted steamed dumplings with spiced buffalo, signature tangy achar, and fresh herbs", price: 180, popular: true, soldOut: false, imageUrl: "https://hungerend.com/wp-content/uploads/2022/03/buff-steam-momo-min.jpg" },
      { id: "s2", name: "Chicken Wings", description: "Crispy twice-fried wings tossed in house-made hot sauce with gorgonzola dip", price: 350, popular: false, soldOut: false, imageUrl: "https://thumbs.dreamstime.com/b/png-crispy-chicken-wings-against-transparent-background-culinary-food-snack-design-projects-png-crispy-chicken-wings-381094820.jpg" },
      { id: "s3", name: "Veg Spring Roll", description: "Crispy golden pastry filled with julienned garden vegetables and sweet chili", price: 220, popular: false, soldOut: false, imageUrl: "https://static.vecteezy.com/system/resources/thumbnails/050/176/342/small/egg-roll-in-white-plate-isolated-on-transparent-background-png.png" },
      { id: "s4", name: "Garlic & Herb Bread", description: "Sourdough batard with roasted garlic butter and aged mozzarella", price: 150, popular: false, soldOut: true, imageUrl: "https://png.pngtree.com/png-vector/20240607/ourmid/pngtree-garlic-bread-concepts-png-image_12638044.png" },
    ],
  },
  {
    id: "soups",
    name: "Soups & Noodles",
    subtitle: "Warming bowls of comfort",
    icon: <Soup size={16} strokeWidth={1.5} />,
    items: [
      { id: "n1", name: "Chicken Thukpa", description: "Amdo-style noodle soup with free-range chicken and Himalayan spices", price: 220, popular: true, soldOut: false, imageUrl: "https://t4.ftcdn.net/jpg/14/45/97/27/360_F_1445972715_hbzkHKcCD2SbnQZ4MKR7u3KUecAjlqz0.jpg" },
      { id: "n2", name: "Chowmein", description: "Wok-fired egg noodles with mixed vegetables and dark soy", price: 200, popular: false, soldOut: false, imageUrl: "https://static.vecteezy.com/system/resources/previews/052/242/093/non_2x/authentic-chinese-chow-mein-illustration-for-culinary-projects-free-png.png" },
      { id: "n3", name: "Chicken Biryani", description: "Dum-cooked basmati rice with spiced chicken and saffron", price: 320, popular: false, soldOut: true, imageUrl: "https://e7.pngegg.com/pngimages/181/501/png-clipart-hyderabadi-biryani-dampokhtak-indian-cuisine-hyderabadi-cuisine-others-miscellaneous-food.png" },
      { id: "n4", name: "Tom Yum Soup", description: "Classic Thai hot & sour with river prawns and lemongrass", price: 260, popular: false, soldOut: false, imageUrl: "https://thumbs.dreamstime.com/b/png-tom-yum-soup-shrimp-basil-bowl-transparent-background-378547481.jpg" },
    ],
  },
  {
    id: "mains",
    name: "Main Course",
    subtitle: "The heart of our kitchen",
    icon: <ChefHat size={16} strokeWidth={1.5} />,
    items: [
      { id: "m1", name: "Grilled Chicken Steak", description: "Free-range breast with truffle mashed potatoes and peppercorn jus", price: 480, popular: true, soldOut: false, imageUrl: "https://img.magnific.com/free-photo/grilled-chicken-with-salad-isolated-white-background_123827-35683.jpg?semt=ais_hybrid&w=740&q=80" },
      { id: "m2", name: "Dal Bhat", description: "24-hour power meal with lentil soup, chicken curry, and pickles", price: 250, popular: true, soldOut: false, imageUrl: "https://img.freepik.com/premium-photo/nepali-meal-daal-bhaat-tarkari-thakali-thali-meat-rice-vegetables-pickle-dhido-meal-dinner_723123-4468.jpg?semt=ais_hybrid&w=740&q=80" },
      { id: "m3", name: "Buff Burger", description: "Hand-pressed buffalo patty with aged cheddar on brioche bun", price: 380, popular: false, soldOut: false, imageUrl: "https://www.kindpng.com/picc/m/70-706025_buffalo-burger-hd-png-download.png" },
      { id: "m4", name: "Pad Thai", description: "Rice noodles with wild-caught shrimp and tamarind sauce", price: 300, popular: false, soldOut: false, imageUrl: "https://png.pngtree.com/png-clipart/20250213/original/pngtree-pad-thai-isolated-on-transparent-background-png-image_20428744.png" },
      { id: "m5", name: "Fish & Chips", description: "Beer-battered local fish with triple-cooked chips", price: 420, popular: false, soldOut: true, imageUrl: "https://images.unsplash.com/photo-1579208030886-b1f3c5b6e64f?w=600&q=80" },
    ],
  },
  {
    id: "drinks",
    name: "Beverages",
    subtitle: "Handcrafted refreshments",
    icon: <Coffee size={16} strokeWidth={1.5} />,
    items: [
      { id: "d1", name: "Iced Latte", description: "Double espresso with cold milk and velvety microfoam", price: 250, popular: true, soldOut: false, imageUrl: "https://img.freepik.com/premium-photo/iced-cafe-latte-with-white-background_985067-3135.jpg" },
      { id: "d2", name: "Fresh Lemonade", description: "Hand-squeezed lemons with garden mint and raw honey", price: 180, popular: false, soldOut: false, imageUrl: "https://media.istockphoto.com/id/185285647/photo/lemonade.jpg?s=612x612&w=0&k=20&c=ZrOxo14Q-6-RI2Rzz8eWtbvr6x14upffYjPx7YRgnKY=" },
      { id: "d3", name: "Mango Lassi", description: "Creamy yogurt with Alphonso mango and green cardamom", price: 220, popular: false, soldOut: false, imageUrl: "https://img.freepik.com/premium-photo/mango-lassi-fresh-smoothie-with-mango-fruit-is-presented-white-background-studio-shot_922357-39882.jpg" },
      { id: "d4", name: "Masala Tea", description: "Nepali chiya with fresh ginger and aromatic spices", price: 80, popular: false, soldOut: false, imageUrl: "https://static.vecteezy.com/system/resources/previews/026/553/517/large_2x/spiced-chai-tea-in-a-white-cup-isolated-on-white-background-free-photo.jpg" },
    ],
  },
  {
    id: "desserts",
    name: "Desserts",
    subtitle: "A sweet finale",
    icon: <Cake size={16} strokeWidth={1.5} />,
    items: [
      { id: "des1", name: "Chocolate Brownie", description: "Warm fudgy brownie with vanilla ice cream and dark chocolate", price: 280, popular: true, soldOut: false, imageUrl: "https://previews.123rf.com/images/jirkaejc/jirkaejc1212/jirkaejc121200089/16853692-chocolate-brownies-dessert-on-white-background.jpg" },
      { id: "des2", name: "Tiramisu", description: "Espresso-soaked ladyfingers with mascarpone cream", price: 350, popular: false, soldOut: false, imageUrl: "https://static.vecteezy.com/system/resources/previews/026/516/076/large_2x/delicious-tiramisu-isolated-on-white-background-photo.jpg" },
      { id: "des3", name: "Apple Crumble", description: "Cinnamon-spiced apples with buttery oat streusel", price: 250, popular: false, soldOut: true, imageUrl: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=600&q=80" },
    ],
  },
];

const categoryIcons: Record<string, React.ReactNode> = {
  Starters: <Salad size={14} strokeWidth={1.5} />,
  "Soups & Noodles": <Soup size={14} strokeWidth={1.5} />,
  "Main Course": <ChefHat size={14} strokeWidth={1.5} />,
  Beverages: <Coffee size={14} strokeWidth={1.5} />,
  Desserts: <Cake size={14} strokeWidth={1.5} />,
};

/* ===================================================================
   COMPONENT
   =================================================================== */

export default function DemoMenuPage() {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedImage]);

  useEffect(() => {
    const checkArrows = () => {
      if (navContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = navContainerRef.current;
        setShowLeftArrow(scrollLeft > 5);
        setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
      }
    };

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
  }, []);

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

  const openImageModal = (imageUrl: string, name: string) => {
    setSelectedImage({ url: imageUrl, name });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Sort items within each category: popular items first, sold out last
  const sortCategoryItems = (items: DemoItem[]): DemoItem[] => {
    return [...items].sort((a, b) => {
      if (a.soldOut && !b.soldOut) return 1;
      if (!a.soldOut && b.soldOut) return -1;
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return 0;
    });
  };

  if (!mounted) return null;

  const allCategories = demoCategories.map(cat => ({
    ...cat,
    items: sortCategoryItems(cat.items),
  }));

  const displayCategories = activeCategory === "all"
    ? allCategories
    : allCategories.filter((cat) => cat.id === activeCategory);

  return (
    <div className="dm-root">
      <div className="dm-ambient" />
      
      <div className="dm-container">
        {/* Back Button */}
        <Link href="/" className="dm-back-btn">
          <ArrowLeft size={16} strokeWidth={1.5} />
          <span>Back to Home</span>
        </Link>

        {/* Menu Card */}
        <div className="dm-card">
          {/* Header */}
          <header className="dm-header">
            <div className="dm-header-bg" />
            <div className="dm-header-shine" />
            <div className="dm-header-glow" />
            
            {/* Logo/Emblem */}
            <div className="dm-emblem">
              {demoRestaurant.logoUrl ? (
                <img 
                  src={demoRestaurant.logoUrl} 
                  alt={demoRestaurant.name} 
                  className="dm-logo" 
                />
              ) : (
                <div className="dm-monogram">
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

            {/* Restaurant Name */}
            <h1 className="dm-title">{demoRestaurant.name}</h1>
            
            {/* Divider */}
            <div className="dm-divider">
              <span className="dm-divider-diamond" />
              <span className="dm-divider-line" />
              <span className="dm-divider-diamond" />
            </div>
            
            {/* Tagline */}
            <p className="dm-tagline">{demoRestaurant.tagline}</p>
            
            {/* Contact Info */}
            <div className="dm-contact">
              <div className="dm-contact-item">
                <MapPin size={12} strokeWidth={1.5} />
                <span>{demoRestaurant.address}</span>
              </div>
              <span className="dm-contact-separator">•</span>
              <div className="dm-contact-item">
                <Phone size={12} strokeWidth={1.5} />
                <span>{demoRestaurant.phone}</span>
              </div>
              <span className="dm-contact-separator">•</span>
              <div className="dm-contact-item">
                <Clock size={12} strokeWidth={1.5} />
                <span>EST. {demoRestaurant.established}</span>
              </div>
            </div>
          </header>

          {/* Category Navigation */}
          <div 
            ref={navWrapperRef}
            className={`dm-nav-wrapper ${navScrolled ? "dm-nav-shadow" : ""}`}
          >
            {showLeftArrow && (
              <button 
                className="dm-nav-arrow dm-nav-arrow-left"
                onClick={() => scrollNav("left")}
                aria-label="Scroll categories left"
              >
                <ChevronLeft size={18} strokeWidth={2} />
              </button>
            )}
            
            <div 
              ref={navContainerRef}
              className="dm-nav"
            >
              <button
                className={`dm-nav-btn ${activeCategory === "all" ? "active" : ""}`}
                onClick={() => setActiveCategory("all")}
              >
                <UtensilsCrossed size={14} strokeWidth={1.5} />
                <span>Full Menu</span>
              </button>
              {demoCategories.map((cat) => (
                <button
                  key={cat.id}
                  className={`dm-nav-btn ${activeCategory === cat.id ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {categoryIcons[cat.name] || <UtensilsCrossed size={14} strokeWidth={1.5} />}
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {showRightArrow && (
              <button 
                className="dm-nav-arrow dm-nav-arrow-right"
                onClick={() => scrollNav("right")}
                aria-label="Scroll categories right"
              >
                <ChevronRight size={18} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Menu Content */}
          <div className="dm-content">
            {displayCategories.map((cat) => (
              <section key={cat.id} className="dm-section">
                {/* Section Header */}
                <div className="dm-section-header">
                  <div className="dm-section-icon">
                    {categoryIcons[cat.name] || <UtensilsCrossed size={16} strokeWidth={1.5} />}
                  </div>
                  <div className="dm-section-header-text">
                    <h2 className="dm-section-title">{cat.name}</h2>
                    {cat.subtitle && (
                      <p className="dm-section-subtitle">{cat.subtitle}</p>
                    )}
                  </div>
                  <span className="dm-section-count">{cat.items.filter(i => !i.soldOut).length}</span>
                </div>

                {/* Menu Items */}
                <div className="dm-items">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className={`dm-item ${item.soldOut ? "sold-out" : ""} ${item.popular && !item.soldOut ? "featured" : ""}`}
                    >
                      {item.popular && !item.soldOut && (
                        <div className="dm-item-badge" />
                      )}

                      <div className="dm-item-main">
                        {/* Item Header */}
                        <div className="dm-item-header">
                          <h3 className="dm-item-name">{item.name}</h3>
                          <span className="dm-item-dots" />
                          <span className="dm-item-price">
                            {item.soldOut ? "-" : `Rs. ${item.price}`}
                          </span>
                        </div>
                        
                        {/* Description with View Image button */}
                        <div className="dm-item-desc-row">
                          <p className="dm-item-desc">{item.description}</p>
                          {!item.soldOut && (
                            <button
                              className="dm-item-view-btn"
                              onClick={() => openImageModal(item.imageUrl, item.name)}
                              title={`View ${item.name}`}
                            >
                              <Eye size={12} strokeWidth={1.5} />
                              <span>View Image</span>
                            </button>
                          )}
                        </div>
                        
                        {/* Tags */}
                        <div className="dm-item-tags">
                          {item.popular && !item.soldOut && (
                            <>
                              <span className="dm-tag popular">
                                <Flame size={10} />
                                Most Popular
                              </span>
                              <span className="dm-tag special">
                                <Award size={10} />
                                Customer Favorite
                              </span>
                            </>
                          )}
                          {item.soldOut && (
                            <span className="dm-tag unavailable">
                              Currently Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Footer */}
          <footer className="dm-footer">
            <div className="dm-footer-divider">
              <span className="dm-footer-divider-line" />
              <span className="dm-footer-divider-diamond" />
              <span className="dm-footer-divider-line" />
            </div>
            <div className="dm-footer-ornament">
              <Heart size={16} fill="#C9A96E" color="#C9A96E" />
            </div>
            <p className="dm-footer-text">Thank you for dining with us</p>
            <p className="dm-footer-subtext">We hope to serve you again soon</p>
            
            <div className="dm-footer-powered">
              <QrCode size={12} strokeWidth={1.5} color="#C9A96E" />
              <span>Powered by <strong>EasyMenu PRO</strong></span>
            </div>
          </footer>
        </div>
      </div>

      {/* Image Modal Overlay */}
      {selectedImage && (
        <div className="dm-modal-overlay" onClick={closeImageModal}>
          <div className="dm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="dm-modal-header">
              <h3 className="dm-modal-title">{selectedImage.name}</h3>
              <button className="dm-modal-close" onClick={closeImageModal}>
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <div className="dm-modal-image-wrapper">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.name} 
                className="dm-modal-image"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      <button 
        className={`dm-scroll-top-btn ${showScrollTop ? "visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <ChevronUp size={20} strokeWidth={2} />
      </button>
    </div>
  );
}