// frontend/app/checkout/page.tsx

"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowRight,
  ArrowLeft,
  QrCode,
  Check,
  Shield,
  CreditCard,
  Lock,
  Building2,
  Coffee,
  Crown,
  Sparkles,
  Loader2,
  LayoutDashboard,
  AlertCircle,
} from "lucide-react";
import "./checkout.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface PlanDetails {
  name: string;
  planKey: string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const planParam = searchParams.get("plan") || "pro";
  const [mounted, setMounted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const planDetails: Record<string, PlanDetails> = {
    starter: {
      name: "Starter",
      planKey: "STARTER",
      monthlyPrice: 10,
      yearlyPrice: 100,
      icon: <Coffee size={24} strokeWidth={1.5} />,
      color: "starter",
      features: [
        "Up to 50 menu items",
        "Basic QR code generation",
        "Simple menu layout",
        "Email support",
        "Standard analytics",
        "1 restaurant location",
        "HD image uploads",
      ],
    },
    pro: {
      name: "Pro",
      planKey: "PRO",
      monthlyPrice: 20,
      yearlyPrice: 200,
      icon: <Crown size={24} strokeWidth={1.5} />,
      color: "pro",
      features: [
        "Unlimited menu items",
        "Custom QR code design",
        "Real-time menu updates",
        "24/7 email support",
        "Advanced analytics",
        "Up to 5 locations",
        "Custom branding",
        "Menu scheduling",
        "Customer feedback collection",
      ],
    },
    enterprise: {
      name: "Enterprise",
      planKey: "ENTERPRISE",
      monthlyPrice: 30,
      yearlyPrice: 300,
      icon: <Building2 size={24} strokeWidth={1.5} />,
      color: "enterprise",
      features: [
        "Everything in Pro",
        "Unlimited locations",
        "API access",
        "Custom integrations",
        "Dedicated account manager",
        "White-label solution",
        "Advanced security",
        "Custom analytics dashboard",
        "Staff management",
        "Priority onboarding",
      ],
    },
  };

  const currentPlan: PlanDetails = planDetails[planParam] || planDetails.pro;
  const price = billingCycle === "yearly" ? currentPlan.yearlyPrice : currentPlan.monthlyPrice;
  const saveAmount = currentPlan.monthlyPrice * 12 - currentPlan.yearlyPrice;

  const getAccessToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  };

  const formatCardNumber = (value: string): string => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts: string[] = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    }
    return value;
  };

  const formatExpiry = (value: string): string => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!cardName.trim()) {
      newErrors.cardName = "Cardholder name is required";
    }
    
    if (cardNumber.replace(/\s/g, "").length < 16) {
      newErrors.cardNumber = "Enter a valid card number";
    }
    
    if (expiry.length < 5) {
      newErrors.expiry = "Enter a valid expiry date";
    }
    
    if (cvc.length < 3) {
      newErrors.cvc = "Enter a valid CVC";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const callUpgradeAPI = async (): Promise<any> => {
    const token = getAccessToken();
    if (!token) {
      throw new Error("Please login again");
    }

    const response = await fetch(`${API_URL}/api/menu/plan/upgrade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        plan: currentPlan.planKey,
        billingCycle: billingCycle,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to upgrade plan");
    }

    return data;
  };

  const handlePayment = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setProcessing(true);
    setUpgradeError("");

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Call backend to upgrade plan
      await callUpgradeAPI();

      setPaymentSuccess(true);
      
      setTimeout(() => {
        router.push(`/dashboard?upgraded=true&plan=${currentPlan.name.toLowerCase()}`);
      }, 2000);
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleBankTransfer = async (): Promise<void> => {
    setProcessing(true);
    setUpgradeError("");

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await callUpgradeAPI();
      setPaymentSuccess(true);
      
      setTimeout(() => {
        router.push(`/dashboard?upgraded=true&plan=${currentPlan.name.toLowerCase()}`);
      }, 2000);
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : "Failed to process. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-loading">
        <Loader2 size={40} strokeWidth={1.5} className="checkout-loading-spinner" />
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (!mounted) {
    return null;
  }

  if (paymentSuccess) {
    return (
      <div className="checkout-root" suppressHydrationWarning>
        <nav className="navbar" suppressHydrationWarning>
          <div className="nav-inner" suppressHydrationWarning>
            <Link href="/" className="nav-logo">
              <QrCode size={19} strokeWidth={2} />
              <span>EasyMenu</span>
            </Link>
          </div>
        </nav>
        <main className="checkout-main" suppressHydrationWarning>
          <div className="container" suppressHydrationWarning>
            <div className="checkout-success" suppressHydrationWarning>
              <div className="checkout-success-icon">
                <Check size={48} strokeWidth={2} />
              </div>
              <h1>Payment Successful!</h1>
              <p>You have been upgraded to the <strong>{currentPlan.name}</strong> plan.</p>
              <p className="checkout-success-redirect">Redirecting to dashboard...</p>
              <Link href="/dashboard" className="btn-primary btn-large">
                <LayoutDashboard size={18} />
                Go to Dashboard
                <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="checkout-root" suppressHydrationWarning>
      {/* NAVBAR */}
      <nav className="navbar" suppressHydrationWarning>
        <div className="nav-inner" suppressHydrationWarning>
          <Link href="/" className="nav-logo">
            <QrCode size={19} strokeWidth={2} />
            <span>EasyMenu</span>
          </Link>
          <div className="nav-right" suppressHydrationWarning>
            <Link href="/dashboard" className="nav-link">
              <LayoutDashboard size={16} strokeWidth={1.5} />
              Dashboard
            </Link>
            <Link href="/membership" className="nav-link">
              Membership
            </Link>
            <span className="nav-user-greeting">
              {user?.restaurant?.name || user?.name}
            </span>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="checkout-main" suppressHydrationWarning>
        <div className="container" suppressHydrationWarning>
          <Link href="/membership" className="checkout-back">
            <ArrowLeft size={15} strokeWidth={2} />
            Back to plans
          </Link>

          <div className="checkout-grid" suppressHydrationWarning>
            {/* LEFT - Payment Form */}
            <div className="checkout-form-section" suppressHydrationWarning>
              <h1 className="checkout-title">Complete your purchase</h1>
              <p className="checkout-subtitle">
                You&apos;re upgrading to the{" "}
                <span className={`checkout-plan-name ${currentPlan.color}`}>
                  {currentPlan.name}
                </span>{" "}
                plan
              </p>

              {upgradeError && (
                <div className="checkout-error-banner">
                  <AlertCircle size={16} />
                  <span>{upgradeError}</span>
                </div>
              )}

              {/* Billing Cycle */}
              <div className="checkout-section" suppressHydrationWarning>
                <h2 className="checkout-section-title">Billing cycle</h2>
                <div className="billing-toggle" suppressHydrationWarning>
                  <button
                    className={`billing-option ${billingCycle === "monthly" ? "active" : ""}`}
                    onClick={() => setBillingCycle("monthly")}
                    type="button"
                  >
                    <div className="billing-option-content">
                      <span className="billing-option-label">Monthly</span>
                      <span className="billing-option-price">
                        ${currentPlan.monthlyPrice}/mo
                      </span>
                    </div>
                  </button>
                  <button
                    className={`billing-option ${billingCycle === "yearly" ? "active" : ""}`}
                    onClick={() => setBillingCycle("yearly")}
                    type="button"
                  >
                    <div className="billing-option-content">
                      <div className="billing-option-header">
                        <span className="billing-option-label">Yearly</span>
                        <span className="billing-save-badge">Save ${saveAmount}</span>
                      </div>
                      <span className="billing-option-price">
                        ${currentPlan.yearlyPrice}/yr
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="checkout-section" suppressHydrationWarning>
                <h2 className="checkout-section-title">Payment method</h2>
                <div className="payment-methods" suppressHydrationWarning>
                  <button
                    className={`payment-method ${paymentMethod === "card" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("card")}
                    type="button"
                  >
                    <CreditCard size={18} strokeWidth={1.5} />
                    <span>Credit Card</span>
                  </button>
                  <button
                    className={`payment-method ${paymentMethod === "bank" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("bank")}
                    type="button"
                  >
                    <Building2 size={18} strokeWidth={1.5} />
                    <span>Bank Transfer</span>
                  </button>
                </div>
              </div>

              {/* Card Form */}
              {paymentMethod === "card" && (
                <form onSubmit={handlePayment} className="checkout-form" suppressHydrationWarning>
                  <div className="form-group" suppressHydrationWarning>
                    <label htmlFor="cardName">Cardholder name</label>
                    <input
                      id="cardName"
                      type="text"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className={`form-input ${errors.cardName ? "error" : ""}`}
                    />
                    {errors.cardName && <span className="form-error">{errors.cardName}</span>}
                  </div>

                  <div className="form-group" suppressHydrationWarning>
                    <label htmlFor="cardNumber">Card number</label>
                    <div className="card-number-wrap">
                      <CreditCard size={18} strokeWidth={1.5} className="input-icon" />
                      <input
                        id="cardNumber"
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        className={`form-input has-icon ${errors.cardNumber ? "error" : ""}`}
                      />
                      <div className="card-logos">
                        <span className="card-logo visa">VISA</span>
                        <span className="card-logo mc">MC</span>
                      </div>
                    </div>
                    {errors.cardNumber && <span className="form-error">{errors.cardNumber}</span>}
                  </div>

                  <div className="form-row" suppressHydrationWarning>
                    <div className="form-group" suppressHydrationWarning>
                      <label htmlFor="expiry">Expiry date</label>
                      <input
                        id="expiry"
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        className={`form-input ${errors.expiry ? "error" : ""}`}
                      />
                      {errors.expiry && <span className="form-error">{errors.expiry}</span>}
                    </div>
                    <div className="form-group" suppressHydrationWarning>
                      <label htmlFor="cvc">CVC</label>
                      <input
                        id="cvc"
                        type="text"
                        placeholder="123"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                        maxLength={4}
                        className={`form-input ${errors.cvc ? "error" : ""}`}
                      />
                      {errors.cvc && <span className="form-error">{errors.cvc}</span>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary btn-full btn-large"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={18} strokeWidth={2} className="spinning" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock size={16} strokeWidth={2} />
                        Pay ${price} — {billingCycle === "yearly" ? "Yearly" : "Monthly"}
                      </>
                    )}
                  </button>

                  <div className="secure-notice" suppressHydrationWarning>
                    <Shield size={14} strokeWidth={1.5} />
                    <span>Your payment info is encrypted and secure</span>
                  </div>
                </form>
              )}

              {paymentMethod === "bank" && (
                <div className="bank-transfer-info" suppressHydrationWarning>
                  <div className="bank-info-card">
                    <h3>Bank Transfer Details</h3>
                    <p>Please transfer the amount to the following account:</p>
                    <div className="bank-details">
                      <div className="bank-detail-row">
                        <span className="bank-label">Bank:</span>
                        <span className="bank-value">Nepal Investment Bank</span>
                      </div>
                      <div className="bank-detail-row">
                        <span className="bank-label">Account Name:</span>
                        <span className="bank-value">EasyMenu Pvt. Ltd.</span>
                      </div>
                      <div className="bank-detail-row">
                        <span className="bank-label">Account Number:</span>
                        <span className="bank-value">00101010012345</span>
                      </div>
                      <div className="bank-detail-row">
                        <span className="bank-label">Amount:</span>
                        <span className="bank-value">${price} USD</span>
                      </div>
                    </div>
                    <p className="bank-note">
                      Your plan will be activated once the payment is confirmed. This usually takes 1-2 business days.
                    </p>
                    <button 
                      className="btn-primary btn-full btn-large" 
                      onClick={handleBankTransfer}
                      disabled={processing}
                      type="button"
                      style={{ marginTop: '16px' }}
                    >
                      {processing ? (
                        <>
                          <Loader2 size={18} strokeWidth={2} className="spinning" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Building2 size={16} strokeWidth={2} />
                          I&apos;ve Made the Transfer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT - Order Summary */}
            <div className="checkout-summary-section" suppressHydrationWarning>
              <div className="order-summary" suppressHydrationWarning>
                <div className="summary-plan-header">
                  <div className={`summary-plan-icon ${currentPlan.color}`}>
                    {currentPlan.icon}
                  </div>
                  <div>
                    <h3 className="summary-plan-name">{currentPlan.name} Plan</h3>
                    <p className="summary-plan-cycle">
                      {billingCycle === "yearly" ? "Yearly" : "Monthly"} billing
                    </p>
                  </div>
                </div>

                <div className="summary-details">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${price}.00</span>
                  </div>
                  <div className="summary-row">
                    <span>Tax</span>
                    <span>$0.00</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-row total">
                    <span>Total due today</span>
                    <span>${price}.00</span>
                  </div>
                  {billingCycle === "yearly" && (
                    <div className="summary-savings">
                      <Sparkles size={12} />
                      <span>You save ${saveAmount} with yearly billing</span>
                    </div>
                  )}
                </div>

                <div className="summary-features">
                  <h4>What&apos;s included:</h4>
                  <ul>
                    {currentPlan.features.slice(0, 5).map((feature: string, index: number) => (
                      <li key={index}>
                        <Check size={12} strokeWidth={2.5} />
                        {feature}
                      </li>
                    ))}
                    {currentPlan.features.length > 5 && (
                      <li className="more-features">
                        +{currentPlan.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>

                <div className="summary-guarantee">
                  <Shield size={14} strokeWidth={1.5} />
                  <span>30-day money-back guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="checkout-loading">
        <Loader2 size={40} strokeWidth={1.5} className="checkout-loading-spinner" />
        <p>Loading checkout...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}