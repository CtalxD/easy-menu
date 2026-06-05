"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "./contexts/AuthContext";
import {
  ArrowRight,
  QrCode,
  Zap,
  Camera,
  Ban,
  Check,
  Star,
  Sparkles,
  LayoutDashboard,
  Crown,
  Coffee,
  MapPin,
  Flame,
  Heart,
  Award,
  Clock,
  UtensilsCrossed,
  Soup,
  ChefHat,
  Cake,
  Salad,
  Phone,
} from "lucide-react";
import "./landing.css";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const problemRef = useRef<HTMLElement>(null);
  const solutionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !mounted) return;

    const initGSAP = async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ScrollTrigger.getAll().forEach((st: any) => st.kill());
      gsap.set(
        [
          ".hero-eyebrow",
          ".hero-title-line",
          ".hero-subtitle",
          ".hero-cta-group",
          ".hero-note",
          ".hero-visual-wrap",
          ".hero-live-badge",
          ".hero-qr-float",
          ".problem-card",
          ".solution-card",
          ".step-item",
          ".preview-text",
          ".preview-phone",
          ".feature-card",
          ".landing-plan-card",
          ".cta-content-wrap",
        ],
        { clearProps: "all" }
      );

      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".hero-eyebrow",
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" }
        );
        gsap.fromTo(
          ".hero-title-line",
          { y: 52, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, stagger: 0.18, ease: "power3.out" }
        );
        gsap.fromTo(
          ".hero-subtitle",
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, delay: 0.55, ease: "power3.out" }
        );
        gsap.fromTo(
          ".hero-cta-group",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, delay: 0.72, ease: "power3.out" }
        );
        gsap.fromTo(
          ".hero-note",
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, delay: 0.88, ease: "power3.out" }
        );
        gsap.fromTo(
          ".hero-visual-wrap",
          { scale: 0.92, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.9, delay: 0.2, ease: "power3.out" }
        );
        gsap.fromTo(
          ".hero-live-badge",
          { x: -18, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.55, delay: 0.7, ease: "power3.out" }
        );
        gsap.fromTo(
          ".hero-qr-float",
          { x: 18, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.55, delay: 0.9, ease: "power3.out" }
        );

        const scrollAnim = (
          selector: string,
          trigger: React.RefObject<HTMLElement | null>,
          fromVars: gsap.TweenVars,
          toVars: gsap.TweenVars
        ) => {
          if (!trigger.current || !selector) return;
          gsap.fromTo(selector, fromVars, {
            ...toVars,
            scrollTrigger: {
              trigger: trigger.current,
              start: "top 82%",
              toggleActions: "play none none none",
            },
          });
        };

        scrollAnim(
          ".problem-card",
          problemRef,
          { y: 48, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, stagger: 0.14, ease: "power3.out" }
        );
        scrollAnim(
          ".solution-card",
          solutionRef,
          { y: 36, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: "power3.out" }
        );
        scrollAnim(
          ".step-item",
          stepsRef,
          { y: 36, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.18, ease: "power3.out" }
        );

        if (previewRef.current) {
          gsap.fromTo(
            ".preview-text",
            { x: -36, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.75,
              ease: "power3.out",
              scrollTrigger: {
                trigger: previewRef.current,
                start: "top 82%",
                toggleActions: "play none none none",
              },
            }
          );
          gsap.fromTo(
            ".preview-phone",
            { x: 36, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.75,
              ease: "power3.out",
              scrollTrigger: {
                trigger: previewRef.current,
                start: "top 82%",
                toggleActions: "play none none none",
              },
            }
          );
        }

        scrollAnim(
          ".feature-card",
          featuresRef,
          { y: 36, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: "power3.out" }
        );
        scrollAnim(
          ".landing-plan-card",
          pricingRef,
          { y: 36, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, stagger: 0.15, ease: "power3.out" }
        );
        scrollAnim(
          ".cta-content-wrap",
          ctaRef,
          { y: 36, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, ease: "power3.out" }
        );
      });

      return () => {
        ctx.revert();
      };
    };

    initGSAP();
  }, [mounted]);

  const marqueeItems = [
    "QR Digital Menus",
    "Instant Updates",
    "No Printing Costs",
    "HD Food Photos",
    "Easy Dashboard",
  ];

  const previewFeaturesList = [
    "Categories keep the menu organized",
    "Popular tags guide customers to bestsellers",
    "Sold out items are crossed out automatically",
    "Prices are clear and easy to scan",
  ];

  const problemCards = [
    {
      num: "01",
      icon: <Ban size={22} strokeWidth={1.5} />,
      title: "Outdated the moment you print",
      desc: "New dish? Price change? You have to reprint everything. Every single time something changes.",
      stat: null,
    },
    {
      num: "02",
      icon: null,
      title: "Yearly printing cost per restaurant",
      desc: "Design fees, quality paper, lamination. All wasted when the menu changes next week.",
      stat: "NPR 15,000+",
    },
    {
      num: "03",
      icon: <Camera size={22} strokeWidth={1.5} />,
      title: "Food photos are expensive to print",
      desc: "Items with photos sell 3× more. But color printing with images costs a fortune.",
      stat: null,
    },
  ];

  const solutionCards = [
    {
      icon: <QrCode size={20} strokeWidth={1.5} />,
      title: "QR code that never changes",
      desc: "Print the QR once. Stick it on tables. The code stays the same even when the menu changes.",
    },
    {
      icon: <Zap size={20} strokeWidth={1.5} />,
      title: "Edit anything, instantly",
      desc: "Update prices, add dishes, mark items sold out. Changes appear on the menu immediately.",
    },
    {
      icon: <Camera size={20} strokeWidth={1.5} />,
      title: "HD food photos at zero cost",
      desc: "Upload high-quality images for every dish. No printing cost. No quality loss.",
    },
  ];

  const stepItems = [
    {
      num: "1",
      title: "Create your menu",
      desc: "Add categories, items, prices and photos from a simple admin dashboard. Takes 5 minutes.",
    },
    {
      num: "2",
      title: "Generate a QR code",
      desc: "Download your unique QR code. Print it. Stick it on tables, counters, or windows.",
    },
    {
      num: "3",
      title: "Customers scan. Menu opens.",
      desc: "No app download. No login. The menu opens instantly in their browser. Clean, readable, fast.",
    },
  ];

  const featureCards = [
    {
      icon: <QrCode size={18} strokeWidth={1.5} />,
      title: "QR menu generation",
      desc: "Unique QR for every restaurant. Customers scan and view instantly.",
    },
    {
      icon: <Zap size={18} strokeWidth={1.5} />,
      title: "Real-time updates",
      desc: "Edit prices or items. Changes go live immediately on the menu.",
    },
    {
      icon: <Camera size={18} strokeWidth={1.5} />,
      title: "Food image upload",
      desc: "Add HD photos to any item. No printing cost for images.",
    },
    {
      icon: <Ban size={18} strokeWidth={1.5} />,
      title: "Out of stock toggle",
      desc: "Ran out? Flip a switch. Item shows as unavailable instantly.",
    },
    {
      icon: <QrCode size={18} strokeWidth={1.5} />,
      title: "Category management",
      desc: "Organize by starters, mains, drinks. Drag and drop order.",
    },
    {
      icon: <Zap size={18} strokeWidth={1.5} />,
      title: "Simple admin dashboard",
      desc: "Manage everything from one clean panel. No training needed.",
    },
  ];

  const showUserContent = mounted && !loading && user;
  const showGuestContent = mounted && !loading && !user;

  return (
    <div className="landing-root" suppressHydrationWarning>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <QrCode size={20} strokeWidth={2} />
            <span>EasyMenu</span>
          </Link>
          <div className="nav-right">
            {!mounted && (
              <>
                <Link href="/membership" className="nav-link">
                  Membership
                </Link>
                <Link href="/login" className="nav-link">
                  Sign in
                </Link>
                <Link href="/signup" className="nav-cta">
                  Get started
                </Link>
              </>
            )}
            {showUserContent && (
              <>
                <Link href="/dashboard" className="nav-link">
                  <LayoutDashboard size={15} strokeWidth={1.5} />
                  Dashboard
                </Link>
                <Link href="/membership" className="nav-link">
                  Membership
                </Link>
                <span className="nav-user-greeting">
                  {user!.restaurant?.name || user!.name}
                </span>
              </>
            )}
            {showGuestContent && (
              <>
                <Link href="/membership" className="nav-link">
                  Membership
                </Link>
                <Link href="/login" className="nav-link">
                  Sign in
                </Link>
                <Link href="/signup" className="nav-cta">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" ref={heroRef}>
        <div className="container">
          <div className="hero-grid">
            <div className="hero-text">
              <div className="hero-eyebrow">
                <span className="hero-eyebrow-dot"></span>
                Digital menus for modern restaurants
              </div>
              <h1 className="hero-title">
                <span className="hero-title-line">
                  Your menu,{" "}
                  <em>instantly</em>
                </span>
                <span className="hero-title-line">
                  <span className="text-accent">digital.</span>
                </span>
              </h1>
              <p className="hero-subtitle">
                Replace printed menus with a QR code. Update items, prices and
                photos anytime - no printing, no apps, no hassle.
              </p>
              <div className="hero-cta-group">
                {!mounted && (
                  <>
                    <Link href="/signup" className="btn-primary">
                      Get started free{" "}
                      <ArrowRight size={15} strokeWidth={2.5} />
                    </Link>
                    <Link href="/m/demo" className="btn-secondary">
                      View demo menu
                    </Link>
                  </>
                )}
                {showUserContent && (
                  <Link href="/dashboard" className="btn-primary">
                    Go to Dashboard{" "}
                    <ArrowRight size={15} strokeWidth={2.5} />
                  </Link>
                )}
                {showGuestContent && (
                  <>
                    <Link href="/signup" className="btn-primary">
                      Get started free{" "}
                      <ArrowRight size={15} strokeWidth={2.5} />
                    </Link>
                    <Link href="/m/demo" className="btn-secondary">
                      View demo menu
                    </Link>
                  </>
                )}
              </div>
              <p className="hero-note">
                Free plan available • Upgrade anytime
              </p>
            </div>

            <div className="hero-visual-wrap">
              <div className="hero-live-badge">
                <span className="live-dot"></span>
                Live menu updates
              </div>
              <div className="hero-phone">
                <div className="phone-notch"></div>
                <div className="phone-screen">
                  <div className="phone-paper-grain"></div>

                  {/* Header - Demo Menu Style */}
                  <div className="phone-menu-header-demo">
                    <div className="phone-emblem-demo">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                    </div>
                    <div className="phone-menu-title-demo">The Orange Cafe</div>
                    <div className="phone-divider-demo">
                      <span className="phone-diamond-demo"></span>
                      <span className="phone-line-demo"></span>
                      <span className="phone-diamond-demo"></span>
                    </div>
                    <div className="phone-tagline-demo">Handcrafted comfort food & specialty coffee</div>
                    <div className="phone-contact-demo">
                      <span><MapPin size="8" strokeWidth={1.5} /> Lakeside, Pokhara</span>
                      <span className="phone-contact-sep">•</span>
                      <span><Phone size="8" strokeWidth={1.5} /> +977 9841000000</span>
                      <span className="phone-contact-sep">•</span>
                      <span><Clock size="8" strokeWidth={1.5} /> EST. 2020</span>
                    </div>
                  </div>

                  {/* Category Nav */}
                  <div className="phone-cat-nav-demo">
                    <span className="phone-cat-pill-demo active">Full Menu</span>
                    <span className="phone-cat-pill-demo">Starters</span>
                    <span className="phone-cat-pill-demo">Soups</span>
                    <span className="phone-cat-pill-demo">Mains</span>
                    <span className="phone-cat-pill-demo">Drinks</span>
                  </div>

                  {/* Content */}
                  <div className="phone-content-demo">
                    {/* Starters Section */}
                    <div className="phone-section-demo">
                      <div className="phone-section-head-demo">
                        <span className="phone-section-icon-demo"><Salad size="10" strokeWidth={1.5} /></span>
                        <span className="phone-section-title-demo">Starters</span>
                        <span className="phone-section-count-demo">3</span>
                      </div>
                      <div className="phone-item-demo featured">
                        <div className="phone-item-badge-demo"></div>
                        <div className="phone-item-content-demo">
                          <div className="phone-item-top-demo">
                            <span className="phone-item-name-demo">Buff Momo</span>
                            <span className="phone-item-dots-demo"></span>
                            <span className="phone-item-price-demo">Rs. 180</span>
                          </div>
                          <div className="phone-item-desc-demo">Steamed dumplings, spiced buffalo, achar</div>
                          <div className="phone-item-tags-demo">
                            <span className="phone-tag-demo popular"><Flame size="6" /> Most Popular</span>
                            <span className="phone-tag-demo special"><Award size="6" /> Customer Favorite</span>
                          </div>
                        </div>
                      </div>
                      <div className="phone-item-demo">
                        <div className="phone-item-content-demo">
                          <div className="phone-item-top-demo">
                            <span className="phone-item-name-demo">Chicken Wings</span>
                            <span className="phone-item-dots-demo"></span>
                            <span className="phone-item-price-demo">Rs. 350</span>
                          </div>
                          <div className="phone-item-desc-demo">Crispy fried wings, hot sauce</div>
                        </div>
                      </div>
                      <div className="phone-item-demo">
                        <div className="phone-item-content-demo">
                          <div className="phone-item-top-demo">
                            <span className="phone-item-name-demo">Veg Spring Roll</span>
                            <span className="phone-item-dots-demo"></span>
                            <span className="phone-item-price-demo">Rs. 220</span>
                          </div>
                          <div className="phone-item-desc-demo">Crispy rolls, sweet chili</div>
                        </div>
                      </div>
                    </div>

                    {/* Mains Section */}
                    <div className="phone-section-demo">
                      <div className="phone-section-head-demo">
                        <span className="phone-section-icon-demo"><ChefHat size="10" strokeWidth={1.5} /></span>
                        <span className="phone-section-title-demo">Main Course</span>
                        <span className="phone-section-count-demo">2</span>
                      </div>
                      <div className="phone-item-demo featured">
                        <div className="phone-item-badge-demo"></div>
                        <div className="phone-item-content-demo">
                          <div className="phone-item-top-demo">
                            <span className="phone-item-name-demo">Chicken Thukpa</span>
                            <span className="phone-item-dots-demo"></span>
                            <span className="phone-item-price-demo">Rs. 220</span>
                          </div>
                          <div className="phone-item-desc-demo">Hot noodle soup, chicken, Himalayan spices</div>
                          <div className="phone-item-tags-demo">
                            <span className="phone-tag-demo popular"><Flame size="6" /> Most Popular</span>
                            <span className="phone-tag-demo special"><Award size="6" /> Customer Favorite</span>
                          </div>
                        </div>
                      </div>
                      <div className="phone-item-demo">
                        <div className="phone-item-content-demo">
                          <div className="phone-item-top-demo">
                            <span className="phone-item-name-demo">Dal Bhat</span>
                            <span className="phone-item-dots-demo"></span>
                            <span className="phone-item-price-demo">Rs. 250</span>
                          </div>
                          <div className="phone-item-desc-demo">Lentil soup, rice, curry, pickles</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="phone-footer-demo">
                    <div className="phone-footer-divider-demo">
                      <span className="phone-footer-line-demo"></span>
                      <span className="phone-footer-diamond-demo"></span>
                      <span className="phone-footer-line-demo"></span>
                    </div>
                    <div className="phone-footer-heart-demo">
                      <Heart size="12" fill="#C9A96E" color="#C9A96E" />
                    </div>
                    <div className="phone-footer-text-demo">Thank you for dining with us</div>
                    <div className="phone-footer-subtext-demo">We hope to serve you again soon</div>
                    <div className="phone-footer-powered-demo">
                      <QrCode size="8" strokeWidth={1.5} color="#C9A96E" />
                      <span>Powered by <strong>EasyMenu</strong></span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hero-qr-float">
                <QrCode size={20} strokeWidth={1.5} />
                <span>Scan for menu</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="marquee-section">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <div key={i} className="marquee-item">
              <Sparkles size={11} />
              <span>{item}</span>
              <span className="marquee-sep"></span>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section className="problem" ref={problemRef}>
        <div className="container">
          <h2 className="section-label">The Problem</h2>
          <h3 className="section-heading">
            Printed menus cost money and become outdated fast
          </h3>
          <div className="problem-grid">
            {problemCards.map((card, i) => (
              <div key={i} className="problem-card">
                <span className="problem-card-number">{card.num}</span>
                {card.stat ? (
                  <div className="problem-stat">{card.stat}</div>
                ) : (
                  <div className="problem-icon">{card.icon}</div>
                )}
                <h4>{card.title}</h4>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="solution" ref={solutionRef}>
        <div className="container">
          <h2 className="section-label">The Solution</h2>
          <h3 className="section-heading">
            One QR code. Your entire menu. Updated in seconds.
          </h3>
          <div className="solution-grid">
            {solutionCards.map((card, i) => (
              <div key={i} className="solution-card">
                <div className="solution-icon-wrap">{card.icon}</div>
                <h4>{card.title}</h4>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="steps" ref={stepsRef}>
        <div className="container">
          <h2 className="section-label">How it works</h2>
          <h3 className="section-heading">Up and running in three steps</h3>
          <div className="steps-grid">
            {stepItems.map((step, i) => (
              <div key={i} className="step-item">
                <div className="step-number">{step.num}</div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE MENU PREVIEW */}
      <section className="preview" ref={previewRef}>
        <div className="container">
          <div className="preview-grid">
            <div className="preview-text">
              <h2 className="section-label">Live menu preview</h2>
              <h3 className="preview-heading">
                Looks like a real paper menu.
                <br />
                Lives on a phone screen.
              </h3>
              <p className="preview-desc">
                Clean layout. Organized by category. Prices clearly shown.
                Popular items highlighted. Sold out items crossed out.
              </p>
              <ul className="preview-checklist">
                {previewFeaturesList.map((f, i) => (
                  <li key={i}>
                    <span className="preview-check">
                      <Check size={11} strokeWidth={2.5} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/m/demo" className="btn-text">
                View live demo <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
            <div className="preview-phone-wrap">
              <div className="preview-phone">
                <div className="phone-notch"></div>
                <div className="phone-screen">
                  <div className="phone-paper-grain"></div>

                  {/* Header - Demo Menu Style */}
                  <div className="phone-menu-header-demo">
                    <div className="phone-emblem-demo">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                    </div>
                    <div className="phone-menu-title-demo">The Orange Cafe</div>
                    <div className="phone-divider-demo">
                      <span className="phone-diamond-demo"></span>
                      <span className="phone-line-demo"></span>
                      <span className="phone-diamond-demo"></span>
                    </div>
                    <div className="phone-tagline-demo">Handcrafted comfort food & specialty coffee</div>
                    <div className="phone-contact-demo">
                      <span><MapPin size="8" strokeWidth={1.5} /> Lakeside, Pokhara</span>
                      <span className="phone-contact-sep">•</span>
                      <span><Phone size="8" strokeWidth={1.5} /> +977 9841000000</span>
                      <span className="phone-contact-sep">•</span>
                      <span><Clock size="8" strokeWidth={1.5} /> EST. 2020</span>
                    </div>
                  </div>

                  {/* Category Nav */}
                  <div className="phone-cat-nav-demo">
                    <span className="phone-cat-pill-demo active">Full Menu</span>
                    <span className="phone-cat-pill-demo">Starters</span>
                    <span className="phone-cat-pill-demo">Soups</span>
                    <span className="phone-cat-pill-demo">Mains</span>
                    <span className="phone-cat-pill-demo">Drinks</span>
                  </div>

                  {/* Content */}
                  <div className="phone-content-demo">
                    {/* Starters Section */}
                    <div className="phone-section-demo">
                      <div className="phone-section-head-demo">
                        <span className="phone-section-icon-demo"><Salad size="10" strokeWidth={1.5} /></span>
                        <span className="phone-section-title-demo">Starters</span>
                        <span className="phone-section-count-demo">3</span>
                      </div>
                      <div className="phone-item-demo featured">
                        <div className="phone-item-badge-demo"></div>
                        <div className="phone-item-content-demo">
                          <div className="phone-item-top-demo">
                            <span className="phone-item-name-demo">Buff Momo</span>
                            <span className="phone-item-dots-demo"></span>
                            <span className="phone-item-price-demo">Rs. 180</span>
                          </div>
                          <div className="phone-item-desc-demo">Steamed dumplings, spiced buffalo, achar</div>
                          <div className="phone-item-tags-demo">
                            <span className="phone-tag-demo popular"><Flame size="6" /> Most Popular</span>
                            <span className="phone-tag-demo special"><Award size="6" /> Customer Favorite</span>
                          </div>
                        </div>
                      </div>
                      <div className="phone-item-demo">
                        <div className="phone-item-content-demo">
                          <div className="phone-item-top-demo">
                            <span className="phone-item-name-demo">Chicken Wings</span>
                            <span className="phone-item-dots-demo"></span>
                            <span className="phone-item-price-demo">Rs. 350</span>
                          </div>
                          <div className="phone-item-desc-demo">Crispy fried wings, hot sauce</div>
                        </div>
                      </div>
                      <div className="phone-item-demo">
                        <div className="phone-item-content-demo">
                          <div className="phone-item-top-demo">
                            <span className="phone-item-name-demo">Veg Spring Roll</span>
                            <span className="phone-item-dots-demo"></span>
                            <span className="phone-item-price-demo">Rs. 220</span>
                          </div>
                          <div className="phone-item-desc-demo">Crispy rolls, sweet chili</div>
                        </div>
                      </div>
                    </div>

                    {/* Soups Section */}
                    <div className="phone-section-demo">
                      <div className="phone-section-head-demo">
                        <span className="phone-section-icon-demo"><Soup size="10" strokeWidth={1.5} /></span>
                        <span className="phone-section-title-demo">Soups & Noodles</span>
                        <span className="phone-section-count-demo">2</span>
                      </div>
                      <div className="phone-item-demo featured">
                        <div className="phone-item-badge-demo"></div>
                        <div className="phone-item-content-demo">
                          <div className="phone-item-top-demo">
                            <span className="phone-item-name-demo">Chicken Thukpa</span>
                            <span className="phone-item-dots-demo"></span>
                            <span className="phone-item-price-demo">Rs. 220</span>
                          </div>
                          <div className="phone-item-desc-demo">Hot noodle soup, chicken, Himalayan spices</div>
                          <div className="phone-item-tags-demo">
                            <span className="phone-tag-demo popular"><Flame size="6" /> Most Popular</span>
                            <span className="phone-tag-demo special"><Award size="6" /> Customer Favorite</span>
                          </div>
                        </div>
                      </div>
                      <div className="phone-item-demo">
                        <div className="phone-item-content-demo">
                          <div className="phone-item-top-demo">
                            <span className="phone-item-name-demo">Chowmein</span>
                            <span className="phone-item-dots-demo"></span>
                            <span className="phone-item-price-demo">Rs. 200</span>
                          </div>
                          <div className="phone-item-desc-demo">Wok-fried noodles, mixed veg</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="phone-footer-demo">
                    <div className="phone-footer-divider-demo">
                      <span className="phone-footer-line-demo"></span>
                      <span className="phone-footer-diamond-demo"></span>
                      <span className="phone-footer-line-demo"></span>
                    </div>
                    <div className="phone-footer-heart-demo">
                      <Heart size="12" fill="#C9A96E" color="#C9A96E" />
                    </div>
                    <div className="phone-footer-text-demo">Thank you for dining with us</div>
                    <div className="phone-footer-subtext-demo">We hope to serve you again soon</div>
                    <div className="phone-footer-powered-demo">
                      <QrCode size="8" strokeWidth={1.5} color="#C9A96E" />
                      <span>Powered by <strong>EasyMenu</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" ref={featuresRef}>
        <div className="container">
          <h2 className="section-label">Features</h2>
          <h3 className="section-heading">Everything your menu needs</h3>
          <div className="features-grid">
            {featureCards.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon-wrap">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" ref={pricingRef}>
        <div className="container">
          <h2 className="section-label">Pricing</h2>
          <h3 className="section-heading">
            Simple, transparent pricing for everyone
          </h3>
          <div className="landing-plans-grid">
            {/* STARTER CARD */}
            <div className="landing-plan-card">
              <div className="landing-plan-icon starter-icon">
                <Coffee size={24} strokeWidth={1.5} />
              </div>
              <h4 className="landing-plan-name">Starter</h4>
              <p className="landing-plan-desc">
                Essential tools for small restaurants getting started
              </p>
              <div className="landing-plan-price">
                <span className="landing-plan-dollar">$</span>
                <span className="landing-plan-amount">10</span>
                <span className="landing-plan-period">/month</span>
              </div>
              <ul className="landing-plan-features">
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Up to 35 menu items
                </li>
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  20 categories
                </li>
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Clean QR code (no watermark)
                </li>
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Standard analytics
                </li>
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  1 restaurant location
                </li>
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Email support
                </li>
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  HD image uploads
                </li>
              </ul>
              <Link
                href="/membership"
                className="btn-secondary btn-full landing-plan-btn"
              >
                View Membership{" "}
                <ArrowRight size={15} strokeWidth={2} />
              </Link>
            </div>

            {/* PRO CARD */}
            <div className="landing-plan-card landing-plan-card-pro">
              <div className="landing-plan-badge">
                <Sparkles size={11} /> Most Popular
              </div>
              <div className="landing-plan-icon pro-icon">
                <Crown size={24} strokeWidth={1.5} />
              </div>
              <h4 className="landing-plan-name">Pro</h4>
              <p className="landing-plan-desc">
                Advanced features for growing restaurants
              </p>
              <div className="landing-plan-price">
                <span className="landing-plan-dollar">$</span>
                <span className="landing-plan-amount">20</span>
                <span className="landing-plan-period">/month</span>
              </div>
              <span className="landing-plan-save">Save 17% yearly</span>
              <ul className="landing-plan-features">
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Everything in Starter
                </li>
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Unlimited menu items
                </li>
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Unlimited categories
                </li>
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Custom QR code design
                </li>
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Advanced analytics
                </li>
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Up to 5 locations
                </li>
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Location-based filtering
                </li>
                <li>
                  <span className="landing-plan-check">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  24/7 priority support
                </li>
              </ul>
              <Link
                href="/membership"
                className="btn-primary btn-full landing-plan-btn landing-plan-btn-pro"
              >
                View Membership{" "}
                <ArrowRight size={15} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta" ref={ctaRef}>
        <div className="container">
          <div className="cta-content-wrap">
            <h2 className="cta-heading">
              Replace your paper menu in 5 minutes
            </h2>
            <p className="cta-desc">
              Walk into any café with a QR code demo. Watch their reaction when
              they realize they'll never print a menu again.
            </p>
            {!mounted && (
              <Link href="/signup" className="btn-primary btn-large">
                Get started free <ArrowRight size={17} strokeWidth={2.5} />
              </Link>
            )}
            {showUserContent && (
              <Link href="/dashboard" className="btn-primary btn-large">
                Go to Dashboard <ArrowRight size={17} strokeWidth={2.5} />
              </Link>
            )}
            {showGuestContent && (
              <Link href="/signup" className="btn-primary btn-large">
                Get started free <ArrowRight size={17} strokeWidth={2.5} />
              </Link>
            )}
            <p className="cta-note">
              Free plan available • Upgrade anytime
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <QrCode size={17} strokeWidth={2} />
            <span>EasyMenu</span>
          </div>
          <p className="footer-copy">Digital menus for every restaurants.</p>
          <div className="footer-links">
            <a href="mailto:easymenunepal@gmail.com">Contact</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}