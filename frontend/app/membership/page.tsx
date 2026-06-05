// frontend/app/membership/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowRight,
  QrCode,
  Star,
  Sparkles,
  LayoutDashboard,
  Check,
  Crown,
  Users,
  Camera,
  BarChart3,
  Headphones,
  Clock,
  Gift,
  TrendingUp,
  Coffee,
  ShoppingCart,
  Loader2,
  BadgeCheck,
  MapPin,
  Palette,
} from "lucide-react";
import "./membership.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface SubscriptionInfo {
  id: string;
  plan: string;
  price: number;
  billingCycle: string;
  paymentStatus: string;
  startDate: string;
  endDate: string;
  purchasedAt: string;
  daysRemaining: number;
  status: string;
}

interface PlanInfo {
  plan: string;
  isFree: boolean;
  hasWatermark: boolean;
  subscription: SubscriptionInfo | null;
}

export default function MembershipPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loadingPlanInfo, setLoadingPlanInfo] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const plansRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user) {
      fetchPlanInfo();
    }
  }, [mounted, user]);

  useEffect(() => {
    if (typeof window === "undefined" || !mounted) return;

    const initGSAP = async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ScrollTrigger.getAll().forEach((st: any) => st.kill());
      gsap.set(
        [
          ".membership-hero-title",
          ".membership-hero-subtitle",
          ".membership-hero-cta",
          ".plan-card",
          ".feature-item",
          ".cta-content",
        ],
        { clearProps: "all" }
      );

      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".membership-hero-title",
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
        );
        gsap.fromTo(
          ".membership-hero-subtitle",
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power3.out" }
        );
        gsap.fromTo(
          ".membership-hero-cta",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: 0.4, ease: "power3.out" }
        );

        if (plansRef.current) {
          gsap.fromTo(
            ".plan-card",
            { y: 48, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              stagger: 0.15,
              ease: "power3.out",
              scrollTrigger: {
                trigger: plansRef.current,
                start: "top 82%",
                toggleActions: "play none none none",
              },
            }
          );
        }

        if (featuresRef.current) {
          gsap.fromTo(
            ".feature-item",
            { y: 36, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              stagger: 0.1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: featuresRef.current,
                start: "top 82%",
                toggleActions: "play none none none",
              },
            }
          );
        }

        if (ctaRef.current) {
          gsap.fromTo(
            ".cta-content",
            { y: 36, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              ease: "power3.out",
              scrollTrigger: {
                trigger: ctaRef.current,
                start: "top 82%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      });

      return () => {
        ctx.revert();
      };
    };

    initGSAP();
  }, [mounted]);

  const fetchPlanInfo = async () => {
    setLoadingPlanInfo(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const response = await fetch(`${API_URL}/api/menu/plan/info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPlanInfo(data);
      }
    } catch (err) {
      console.error("fetchPlanInfo error:", err);
    } finally {
      setLoadingPlanInfo(false);
    }
  };

  const scrollToPlans = (e: React.MouseEvent) => {
    e.preventDefault();
    const plansSection = document.getElementById('plans');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const plans = [
    {
      name: "Starter",
      planKey: "STARTER",
      price: "10",
      period: "/month",
      description: "Essential tools for small restaurants getting started with digital menus",
      icon: <Coffee size={28} strokeWidth={1.5} />,
      color: "starter",
      popular: false,
      badge: "",
      features: [
        "Up to 50 menu items",
        "20 categories",
        "Clean QR code (no watermark)",
        "Standard analytics",
        "1 restaurant location",
        "Email support",
        "HD image uploads",
      ],
      cta: "Get Started",
      ctaLoggedIn: "Choose Starter",
      href: "/signup",
      hrefLoggedIn: "/checkout?plan=starter",
    },
    {
      name: "Pro",
      planKey: "PRO",
      price: "20",
      period: "/month",
      description: "Advanced features for growing restaurants that need more power",
      icon: <Crown size={28} strokeWidth={1.5} />,
      color: "pro",
      popular: true,
      badge: "Most Popular",
      features: [
        "Everything in Starter",
        "Unlimited menu items",
        "Unlimited categories",
        "Custom QR code design",
        "Advanced analytics",
        "Up to 5 locations",
        "Location-based filtering",
        "24/7 priority support",
      ],
      cta: "Start Free Trial",
      ctaLoggedIn: "Choose Pro",
      href: "/signup",
      hrefLoggedIn: "/checkout?plan=pro",
    },
  ];

  const comparisonFeatures = [
    { name: "Menu Items", starter: "50 items", pro: "Unlimited" },
    { name: "Categories", starter: "20 categories", pro: "Unlimited" },
    { name: "QR Code", starter: "Clean (no watermark)", pro: "Custom design" },
    { name: "Analytics", starter: "Standard", pro: "Advanced" },
    { name: "Locations", starter: "1", pro: "Up to 5" },
    { name: "Location Filtering", starter: "No", pro: "Yes" },
    { name: "Support", starter: "Email", pro: "24/7 Priority" },
    { name: "Image Uploads", starter: "HD Quality", pro: "HD Quality" },
  ];

  const additionalFeatures = [
    { icon: <TrendingUp size={20} strokeWidth={1.5} />, title: "Real-time Analytics", description: "Track menu views, popular items, and customer engagement in real time" },
    { icon: <QrCode size={20} strokeWidth={1.5} />, title: "QR Code Generation", description: "Generate clean, customizable QR codes for your digital menu" },
    { icon: <MapPin size={20} strokeWidth={1.5} />, title: "Multi-Location Support", description: "Manage up to 5 locations from a single dashboard (Pro)" },
    { icon: <Palette size={20} strokeWidth={1.5} />, title: "Custom QR Design", description: "Customize your QR code colors to match your brand (Pro)" },
    { icon: <Headphones size={20} strokeWidth={1.5} />, title: "Priority Support", description: "Get help when you need it with dedicated support channels (Pro)" },
    { icon: <Camera size={20} strokeWidth={1.5} />, title: "HD Menu Photos", description: "Showcase your dishes with crystal-clear images" },
    { icon: <BarChart3 size={20} strokeWidth={1.5} />, title: "Menu Analytics", description: "Detailed insights into your menu performance" },
    { icon: <Gift size={20} strokeWidth={1.5} />, title: "Regular Updates", description: "New features and improvements added regularly" },
    { icon: <Users size={20} strokeWidth={1.5} />, title: "Built for Restaurants", description: "Purpose-built tools designed specifically for modern food businesses" },
  ];

  const isLoggedIn = user && !loading;
  const currentPlan = planInfo?.plan || "FREE";
  const activeSubscription = planInfo?.subscription;
  const isSubscribed = activeSubscription && activeSubscription.status === 'active';
  const isExpired = activeSubscription && activeSubscription.status === 'expired';

  const getPlanButton = (plan: typeof plans[0]) => {
    if (!isLoggedIn) {
      return (
        <Link href={plan.href} className={`plan-cta-btn ${plan.popular ? "popular-cta" : ""}`}>
          {plan.cta}
          <ArrowRight size={18} strokeWidth={2.5} />
        </Link>
      );
    }

    if (loadingPlanInfo) {
      return (
        <button className="plan-cta-btn" disabled type="button">
          <Loader2 size={18} className="spinning" />
          Loading...
        </button>
      );
    }

    if (isSubscribed && activeSubscription && activeSubscription.plan === plan.planKey) {
      return (
        <div className="plan-active-badge">
          <BadgeCheck size={18} strokeWidth={2} />
          <span>Current Plan</span>
        </div>
      );
    }

    if (isExpired && activeSubscription && activeSubscription.plan === plan.planKey) {
      return (
        <Link href={plan.hrefLoggedIn} className="plan-cta-btn renew-cta">
          <Crown size={18} strokeWidth={2.5} />
          Renew Plan
          <ArrowRight size={18} strokeWidth={2.5} />
        </Link>
      );
    }

    if (currentPlan === "FREE") {
      return (
        <Link href={plan.hrefLoggedIn} className={`plan-cta-btn buy-now-cta ${plan.popular ? "popular-cta" : ""}`}>
          {plan.ctaLoggedIn}
          <ShoppingCart size={18} strokeWidth={2.5} />
        </Link>
      );
    }

    const planOrder = ["FREE", "STARTER", "PRO"];
    const currentIndex = planOrder.indexOf(currentPlan);
    const targetIndex = planOrder.indexOf(plan.planKey);

    if (targetIndex > currentIndex) {
      return (
        <Link href={plan.hrefLoggedIn} className={`plan-cta-btn buy-now-cta ${plan.popular ? "popular-cta" : ""}`}>
          Upgrade to {plan.name}
          <ArrowRight size={18} strokeWidth={2.5} />
        </Link>
      );
    }

    return (
      <button className="plan-cta-btn" disabled type="button">
        Current or Lower Plan
      </button>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="membership-root" suppressHydrationWarning>
      {/* NAVBAR */}
      <nav className="navbar" suppressHydrationWarning>
        <div className="nav-inner" suppressHydrationWarning>
          <Link href="/" className="nav-logo">
            <QrCode size={19} strokeWidth={2} />
            <span>EasyMenu</span>
          </Link>
          <div className="nav-right" suppressHydrationWarning>
            {!mounted ? (
              <>
                <Link href="/membership" className="nav-link">Membership</Link>
                <Link href="/login" className="nav-link">Sign in</Link>
                <Link href="/signup" className="nav-cta">Get started</Link>
              </>
            ) : !loading && (
              <>
                {user ? (
                  <>
                    <Link href="/dashboard" className="nav-link">
                      <LayoutDashboard size={16} strokeWidth={1.5} />
                      Dashboard
                    </Link>
                    <Link href="/membership" className="nav-link">Membership</Link>
                    <span className="nav-user-greeting">
                      {user.restaurant?.name || user.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Link href="/membership" className="nav-link">Membership</Link>
                    <Link href="/login" className="nav-link">Sign in</Link>
                    <Link href="/signup" className="nav-cta">Get started</Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="membership-hero" ref={heroRef} suppressHydrationWarning>
        <div className="container" suppressHydrationWarning>
          <div className="membership-hero-content" suppressHydrationWarning>
            <div className="hero-eyebrow" suppressHydrationWarning>
              <span className="hero-eyebrow-dot"></span>
              {isLoggedIn ? (
                isSubscribed ? "Manage your membership" : isExpired ? "Renew your plan" : "Upgrade your plan"
              ) : (
                "Choose your plan"
              )}
            </div>
            <h1 className="membership-hero-title" suppressHydrationWarning>
              {isLoggedIn ? (
                isSubscribed ? (
                  <>
                    Your <span className="text-accent">{activeSubscription!.plan.toLowerCase()}</span> plan is active
                  </>
                ) : isExpired ? (
                  <>
                    Renew your <span className="text-accent">membership</span>
                  </>
                ) : (
                  <>
                    Unlock more features for
                    <br />
                    <span className="text-accent">your restaurant</span>
                  </>
                )
              ) : (
                <>
                  Find the perfect plan for
                  <br />
                  <span className="text-accent">your restaurant</span>
                </>
              )}
            </h1>
            <p className="membership-hero-subtitle" suppressHydrationWarning>
              {isLoggedIn ? (
                isSubscribed ? (
                  `Your ${activeSubscription!.plan.toLowerCase()} plan is active until ${formatDate(activeSubscription!.endDate)} with ${activeSubscription!.daysRemaining} days remaining.`
                ) : isExpired ? (
                  "Your subscription has expired. Renew now to restore premium features."
                ) : (
                  "Upgrade to a higher plan and get access to more powerful features for your growing business."
                )
              ) : (
                "From small food stalls to growing restaurant chains, we have a plan that fits your needs and budget."
              )}
            </p>
            <div className="membership-hero-cta" suppressHydrationWarning>
              <a href="#plans" className="btn-primary" onClick={scrollToPlans}>
                View plans <ArrowRight size={15} strokeWidth={2.5} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className="membership-plans" id="plans" ref={plansRef} suppressHydrationWarning>
        <div className="container" suppressHydrationWarning>
          <h2 className="section-label">Pricing Plans</h2>
          <h3 className="section-heading">
            Simple, transparent pricing for everyone
          </h3>
          <div className="plans-grid" suppressHydrationWarning>
            {plans.map((plan, index) => {
              const isCurrentPlan = isSubscribed && activeSubscription && activeSubscription.plan === plan.planKey;
              const isExpiredPlan = isExpired && activeSubscription && activeSubscription.plan === plan.planKey;

              return (
                <div
                  key={index}
                  className={`plan-card-wrap ${plan.popular ? "popular" : ""} ${isCurrentPlan ? "current-plan" : ""}`}
                  suppressHydrationWarning
                >
                  <div className={`plan-card ${plan.color} ${plan.popular ? "popular-card" : ""} ${isCurrentPlan ? "active-plan-card" : ""}`} suppressHydrationWarning>
                    {plan.badge && (
                      <div className="plan-badge" suppressHydrationWarning>
                        <Sparkles size={11} /> {plan.badge}
                      </div>
                    )}

                    {isCurrentPlan && (
                      <div className="plan-current-badge" suppressHydrationWarning>
                        <BadgeCheck size={14} />
                        Current Plan
                      </div>
                    )}

                    {isExpiredPlan && (
                      <div className="plan-expired-badge" suppressHydrationWarning>
                        Expired
                      </div>
                    )}
                    
                    <div className="plan-header" suppressHydrationWarning>
                      <div className={`plan-icon-wrap ${plan.color}`} suppressHydrationWarning>
                        {plan.icon}
                      </div>
                      <h3 className="plan-name">{plan.name}</h3>
                      <p className="plan-description">{plan.description}</p>
                    </div>

                    <div className="plan-price-section" suppressHydrationWarning>
                      <div className="plan-price" suppressHydrationWarning>
                        <span className="plan-dollar">$</span>
                        <span className="plan-amount">{plan.price}</span>
                        <span className="plan-period">{plan.period}</span>
                      </div>
                      {plan.popular && (
                        <span className="plan-save">Save 17% yearly</span>
                      )}
                    </div>

                    <ul className="plan-features" suppressHydrationWarning>
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} suppressHydrationWarning>
                          <span className="plan-check">
                            <Check size={11} strokeWidth={2.5} />
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {getPlanButton(plan)}

                    {isCurrentPlan && activeSubscription && (
                      <div className="plan-subscription-info">
                        <div className="plan-subscription-row">
                          <Clock size={12} />
                          <span>{activeSubscription.daysRemaining} days remaining</span>
                        </div>
                        <div className="plan-subscription-row">
                          <span>Renews: {formatDate(activeSubscription.endDate)}</span>
                        </div>
                      </div>
                    )}

                    {!isLoggedIn && plan.popular && (
                      <p className="plan-note">
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURE COMPARISON TABLE */}
      <section className="membership-comparison" suppressHydrationWarning>
        <div className="container" suppressHydrationWarning>
          <h2 className="section-label">Compare Plans</h2>
          <h3 className="section-heading">Detailed feature comparison</h3>
          <div className="comparison-table-wrap" suppressHydrationWarning>
            <table className="comparison-table" suppressHydrationWarning>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th className="plan-col starter-col">Starter</th>
                  <th className="plan-col pro-col">Professional</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index}>
                    <td className="feature-name">{feature.name}</td>
                    <td className="starter-col">{feature.starter}</td>
                    <td className="pro-col">{feature.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ADDITIONAL FEATURES */}
      <section className="membership-features" ref={featuresRef} suppressHydrationWarning>
        <div className="container" suppressHydrationWarning>
          <h2 className="section-label">All Plans Include</h2>
          <h3 className="section-heading">Everything you need to succeed</h3>
          <div className="membership-features-grid" suppressHydrationWarning>
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="feature-item" suppressHydrationWarning>
                <div className="feature-icon-wrap">{feature.icon}</div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && !loading && (
        <section className="membership-cta" ref={ctaRef} suppressHydrationWarning>
          <div className="container" suppressHydrationWarning>
            <div className="cta-content" suppressHydrationWarning>
              <div className="cta-icon" suppressHydrationWarning>
                <Crown size={32} strokeWidth={1.5} />
              </div>
              <h2 className="cta-heading">
                Ready to upgrade your menu experience?
              </h2>
              <p className="cta-desc">
                Create beautiful digital menus that your customers will love. Start your free trial today — no credit card required.
              </p>
              <div className="cta-buttons" suppressHydrationWarning>
                <Link href="/signup" className="btn-primary btn-large">
                  Start free trial <ArrowRight size={17} strokeWidth={2.5} />
                </Link>
              </div>
              <p className="cta-note">
              
              </p>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="footer" suppressHydrationWarning>
        <div className="container footer-inner" suppressHydrationWarning>
          <div className="footer-brand" suppressHydrationWarning>
            <QrCode size={17} strokeWidth={2} />
            <span>EasyMenu</span>
          </div>
          <p className="footer-copy">Digital menus for modern restaurants.</p>
          <div className="footer-links" suppressHydrationWarning>
            <a href="mailto:easymenunepal@gmail.com">Contact</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}