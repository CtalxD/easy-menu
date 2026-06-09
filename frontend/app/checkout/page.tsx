// frontend/app/checkout/page.tsx

"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowRight,
  ArrowLeft,
  QrCode,
  Check,
  Shield,
  Building2,
  Coffee,
  Crown,
  Sparkles,
  Loader2,
  LayoutDashboard,
  AlertCircle,
  Wallet,
  Clock,
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
  const [paymentMethod, setPaymentMethod] = useState<string>("esewa");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState<string>("NPR");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [currentPlanInfo, setCurrentPlanInfo] = useState<any>(null);
  const [planInfoLoading, setPlanInfoLoading] = useState(true);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [pendingRequestDetails, setPendingRequestDetails] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    USD: 1,
    NPR: 133.50,
  });
  const [ratesLoading, setRatesLoading] = useState(true);

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

  useEffect(() => {
    setMounted(true);
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      checkPendingRequestForPlan();
    }
  }, [user, planParam]);

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.ok) {
        const data = await response.json();
        setExchangeRates({
          USD: 1,
          NPR: data.rates.NPR || 133.50,
        });
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setExchangeRates({
        USD: 1,
        NPR: 133.50,
      });
    } finally {
      setRatesLoading(false);
    }
  };

  const checkPendingRequestForPlan = async () => {
    setPlanInfoLoading(true);
    try {
      const token = getAccessToken();
      if (!token) {
        setPlanInfoLoading(false);
        return;
      }

      const subscriptionResponse = await fetch(`${API_URL}/api/menu/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        const selectedPlanKey = planDetails[planParam]?.planKey || 'PRO';
        
        if (subscriptionData.latestSubscription && 
            subscriptionData.latestSubscription.paymentStatus === 'PENDING' &&
            subscriptionData.latestSubscription.plan === selectedPlanKey) {
          setHasPendingRequest(true);
          setPendingRequestDetails(subscriptionData.latestSubscription);
        } else {
          setHasPendingRequest(false);
          setPendingRequestDetails(null);
        }
      }

      const planResponse = await fetch(`${API_URL}/api/menu/plan/info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (planResponse.ok) {
        const planData = await planResponse.json();
        setCurrentPlanInfo(planData);
      }
    } catch (error) {
      console.error('Error checking pending request:', error);
    } finally {
      setPlanInfoLoading(false);
    }
  };

  const priceUSD = billingCycle === "yearly" ? currentPlan.yearlyPrice : currentPlan.monthlyPrice;
  const saveAmount = currentPlan.monthlyPrice * 12 - currentPlan.yearlyPrice;
  
  const exchangeRate = exchangeRates[currency] || 1;
  const convertedPrice = Math.round(priceUSD * exchangeRate);
  
  const formatPrice = (amount: number, curr: string): string => {
    if (curr === "NPR") {
      return `Rs. ${amount.toLocaleString()}`;
    }
    return `$${amount}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccessToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
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
      if (data.code === 'PENDING_REQUEST_EXISTS') {
        setHasPendingRequest(true);
        setPendingRequestDetails(data.existingSubscription);
        throw new Error(data.message || 'You already have a pending upgrade request for this plan.');
      }
      throw new Error(data.message || 'Failed to upgrade plan');
    }

    return data;
  };

  const handlePaymentConfirmation = async (): Promise<void> => {
    if (hasPendingRequest) return;
    
    setProcessing(true);
    setUpgradeError("");

    try {
      const result = await callUpgradeAPI();
      setHasPendingRequest(true);
      if (result.subscription) {
        setPendingRequestDetails(result.subscription);
      }
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const currencies = ["USD", "NPR"];

  const canApplyForPlan = (): { allowed: boolean; message: string } => {
    if (!currentPlanInfo) return { allowed: true, message: '' };

    const currentUserPlan = currentPlanInfo.plan;
    const selectedPlan = currentPlan.planKey;
    const subscription = currentPlanInfo.subscription;

    if (currentUserPlan === 'FREE') {
      return { allowed: true, message: '' };
    }

    if (currentUserPlan === selectedPlan) {
      return { allowed: false, message: `You are already on the ${currentUserPlan} plan.` };
    }

    if (selectedPlan === 'FREE') {
      if (subscription && subscription.status === 'active') {
        return { 
          allowed: false, 
          message: `Your ${currentUserPlan} plan is still active. Please wait until your current subscription expires before downgrading to FREE plan.` 
        };
      }
      return { allowed: true, message: '' };
    }

    const planOrder = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
    const currentIndex = planOrder.indexOf(currentUserPlan);
    const selectedIndex = planOrder.indexOf(selectedPlan);

    if (selectedIndex > currentIndex) {
      return { allowed: true, message: '' };
    }

    return { 
      allowed: false, 
      message: `You cannot downgrade from ${currentUserPlan} to ${selectedPlan} while your subscription is active.` 
    };
  };

  const eligibility = canApplyForPlan();

  if (loading || planInfoLoading || ratesLoading) {
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

  if (!eligibility.allowed && !hasPendingRequest) {
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
            <div className="checkout-error-container" suppressHydrationWarning>
              <div className="checkout-error-icon">
                <AlertCircle size={48} strokeWidth={2} />
              </div>
              <h1>Unable to Process</h1>
              <p className="checkout-error-message">{eligibility.message}</p>
              <Link href="/membership" className="btn-primary btn-large">
                <ArrowLeft size={18} />
                Back to Plans
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
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
              <div className="checkout-success-icon pending-icon">
                <Loader2 size={48} strokeWidth={2} className="spinning" />
              </div>
              <h1>Payment Submitted!</h1>
              <p>Your upgrade request to the <strong>{currentPlan.name}</strong> plan has been submitted.</p>
              <p className="checkout-pending-message">
                Your payment is being verified. The membership will be activated once an admin approves it. 
                This usually takes 1 to 2 business days.
              </p>
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

              {hasPendingRequest && (
                <div className="checkout-pending-banner">
                  <Clock size={20} strokeWidth={2} />
                  <div className="checkout-pending-banner-content">
                    <h3>Application Already Submitted</h3>
                    <p>
                      You have already applied for the <strong>{currentPlan.name}</strong> plan. 
                      Please wait for admin approval. This usually takes 1 to 2 business days.
                    </p>
                    {pendingRequestDetails && (
                      <p className="checkout-pending-date">
                        Submitted on: {formatDate(pendingRequestDetails.purchasedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Currency Selector */}
              <div className="checkout-section" suppressHydrationWarning>
                <h2 className="checkout-section-title">Currency</h2>
                <div className="currency-selector" suppressHydrationWarning>
                  {currencies.map((curr) => (
                    <button
                      key={curr}
                      className={`currency-option ${currency === curr ? "active" : ""}`}
                      onClick={() => setCurrency(curr)}
                      type="button"
                    >
                      <span className="currency-flag">
                        {curr === "NPR" ? "🇳🇵" : "🇺🇸"}
                      </span>
                      <span className="currency-info">
                        <span className="currency-code">{curr}</span>
                        <span className="currency-name">
                          {curr === "NPR" ? "Nepali Rupees" : "US Dollars"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

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
                        {formatPrice(Math.round(currentPlan.monthlyPrice * exchangeRate), currency)}/mo
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
                        <span className="billing-save-badge">
                          Save {formatPrice(Math.round(saveAmount * exchangeRate), currency)}
                        </span>
                      </div>
                      <span className="billing-option-price">
                        {formatPrice(Math.round(currentPlan.yearlyPrice * exchangeRate), currency)}/yr
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
                    className={`payment-method ${paymentMethod === "esewa" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("esewa")}
                    type="button"
                  >
                    <Wallet size={18} strokeWidth={1.5} />
                    <span>eSewa</span>
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

              {/* eSewa Payment */}
              {paymentMethod === "esewa" && (
                <div className="payment-qr-section" suppressHydrationWarning>
                  <div className="payment-info-card">
                    <div className="payment-header">
                      <div className="payment-logo esewa-logo">
                        <span>eSewa</span>
                      </div>
                      <div className="payment-header-text">
                        <h3>Pay with eSewa</h3>
                        <p>Fast & secure digital wallet payment</p>
                      </div>
                    </div>
                    
                    <p className="payment-instruction">
                      Scan the QR code below using your eSewa app or manually enter the details to complete payment.
                    </p>

                    <div className="qr-container">
                      <div className="qr-code-wrapper">
                        <Image
                          src="/esewa.jpeg"
                          alt="eSewa QR Code"
                          width={200}
                          height={200}
                          className="payment-qr-image"
                          priority
                        />
                      </div>
                      <p className="qr-caption">Scan with eSewa app</p>
                    </div>

                    <div className="payment-details">
                      <h4 className="payment-details-title">Payment Details</h4>
                      <div className="payment-detail-row total-row">
                        <span className="detail-label">Amount</span>
                        <span className="detail-value amount-value">
                          {formatPrice(convertedPrice, currency)}
                        </span>
                      </div>
                    </div>

                    <p className="payment-note">
                      After completing the payment, click the button below. Your membership will be activated once an admin verifies and approves your payment.
                    </p>

                    {hasPendingRequest ? (
                      <button 
                        className="btn-pending btn-full" 
                        disabled
                        type="button"
                      >
                        <Clock size={18} strokeWidth={2} />
                        Waiting for Admin Approval
                      </button>
                    ) : (
                      <button 
                        className="btn-primary btn-full" 
                        onClick={handlePaymentConfirmation}
                        disabled={processing}
                        type="button"
                      >
                        {processing ? (
                          <>
                            <Loader2 size={18} strokeWidth={2} className="spinning" />
                            Submitting Payment...
                          </>
                        ) : (
                          <>
                            <Shield size={16} strokeWidth={2} />
                            I've Made the Payment
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Bank Transfer */}
              {paymentMethod === "bank" && (
                <div className="payment-qr-section" suppressHydrationWarning>
                  <div className="payment-info-card">
                    <div className="payment-header">
                      <div className="payment-logo bank-logo">
                        <Building2 size={20} strokeWidth={1.5} />
                      </div>
                      <div className="payment-header-text">
                        <h3>Bank Transfer</h3>
                        <p>Direct bank deposit</p>
                      </div>
                    </div>

                    <p className="payment-instruction">
                      Scan the QR code below with your banking app to make the transfer.
                    </p>

                    <div className="qr-container">
                      <div className="qr-code-wrapper">
                        <Image
                          src="/bank.jpeg"
                          alt="Bank QR Code"
                          width={200}
                          height={200}
                          className="payment-qr-image"
                          priority
                        />
                      </div>
                      <p className="qr-caption">Scan with banking app</p>
                    </div>

                    <div className="payment-details">
                      <h4 className="payment-details-title">Payment Details</h4>
                      <div className="payment-detail-row">
                        <span className="detail-label">Bank</span>
                        <span className="detail-value">Nabil Bank Limited</span>
                      </div>
                      <div className="payment-detail-row total-row">
                        <span className="detail-label">Amount</span>
                        <span className="detail-value amount-value">
                          {formatPrice(convertedPrice, currency)}
                        </span>
                      </div>
                    </div>

                    <p className="payment-note">
                      After completing the transfer, click the button below. Your membership will be activated once an admin verifies and approves your payment.
                    </p>

                    {hasPendingRequest ? (
                      <button 
                        className="btn-pending btn-full" 
                        disabled
                        type="button"
                      >
                        <Clock size={18} strokeWidth={2} />
                        Waiting for Admin Approval
                      </button>
                    ) : (
                      <button 
                        className="btn-primary btn-full" 
                        onClick={handlePaymentConfirmation}
                        disabled={processing}
                        type="button"
                      >
                        {processing ? (
                          <>
                            <Loader2 size={18} strokeWidth={2} className="spinning" />
                            Submitting Payment...
                          </>
                        ) : (
                          <>
                            <Building2 size={16} strokeWidth={2} />
                            I've Made the Transfer
                          </>
                        )}
                      </button>
                    )}
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
                    <span>{formatPrice(convertedPrice, currency)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tax</span>
                    <span>{formatPrice(0, currency)}</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-row total">
                    <span>Total due today</span>
                    <span>{formatPrice(convertedPrice, currency)}</span>
                  </div>
                  {billingCycle === "yearly" && (
                    <div className="summary-savings">
                      <Sparkles size={12} />
                      <span>You save {formatPrice(Math.round(saveAmount * exchangeRate), currency)} with yearly billing</span>
                    </div>
                  )}
                </div>

                <div className="summary-features">
                  <h4>What&apos;s included</h4>
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