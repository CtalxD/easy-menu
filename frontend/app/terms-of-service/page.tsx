// frontend/app/terms-of-service/page.tsx
"use client";

import Link from "next/link";
import { ArrowLeft, QrCode } from "lucide-react";
import "./terms-of-service.css";

export default function TermsOfServicePage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
        
        <div className="legal-header">
          <div className="legal-logo">
            <QrCode size={28} strokeWidth={1.5} />
            <span>EasyMenu</span>
          </div>
          <h1>Terms of Service</h1>
          <p className="legal-date">Last Updated: June 8, 2026</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using EasyMenu's digital menu platform ("Service"), you agree to be bound by these Terms of Service ("Terms").
              If you disagree with any part of these Terms, you may not access or use our Service.
            </p>
            <p>
              These Terms apply to all users of the Service, including restaurant owners, menu administrators, and menu viewers.
              By using our Service, you represent that you are at least 18 years of age or have parental consent.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              EasyMenu provides a digital menu platform that allows restaurants to:
            </p>
            <ul>
              <li>Create and manage digital menus accessible via QR codes</li>
              <li>Upload food images, descriptions, and prices</li>
              <li>Organize menu items into categories</li>
              <li>Track menu views and analytics</li>
              <li>Manage multiple locations (depending on subscription plan)</li>
              <li>Schedule menu updates (Pro plan and above)</li>
            </ul>
            <p>
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time without notice.
              We will not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.
            </p>
          </section>

          <section>
            <h2>3. Account Registration and Security</h2>
            <p>
              To access certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your information to keep it accurate</li>
              <li>Maintain the security and confidentiality of your password</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
            <p>
              You may not share your account credentials with others. You are solely responsible for all activity conducted through your account.
            </p>
          </section>

          <section>
            <h2>4. Subscription Plans and Payments</h2>
            
            <h3>4.1 Plans Available</h3>
            <p>We offer the following subscription plans:</p>
            <ul>
              <li><strong>Free:</strong> Basic features with limitations (10 items, 5 categories, watermark on QR code)</li>
              <li><strong>Starter:</strong> $10/month or $100/year (50 items, 20 categories, no watermark)</li>
              <li><strong>Pro:</strong> $20/month or $200/year (unlimited items, custom QR design, analytics)</li>
            </ul>

            <h3>4.2 Billing and Payment</h3>
            <p>
              All subscription fees are billed in advance on a monthly or yearly basis depending on your selected billing cycle.
              Payments are non-refundable except as required by law or as expressly stated in these Terms.
            </p>
            <p>
              We may change our subscription fees from time to time. We will notify you of any price changes at least 30 days in advance.
              Your continued use of the Service after the price change constitutes your agreement to the new fees.
            </p>
          </section>

          <section>
            <h2>5. User Content and Conduct</h2>
            
            <h3>5.1 Your Content</h3>
            <p>
              You retain all ownership rights to the content you upload to our Service, including menu items, descriptions, images, and restaurant information.
              By uploading content, you grant EasyMenu a non-exclusive, worldwide, royalty-free license to host, store, display, and distribute your content as necessary to provide the Service.
            </p>

            <h3>5.2 Prohibited Content</h3>
            <p>You may not upload content that:</p>
            <ul>
              <li>Infringes on any third-party intellectual property rights</li>
              <li>Contains illegal, offensive, or harmful material</li>
              <li>Promotes violence, discrimination, or hatred</li>
              <li>Contains false, misleading, or deceptive information</li>
              <li>Violates any applicable laws or regulations</li>
            </ul>

            <h3>5.3 Acceptable Use</h3>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Reverse engineer or decompile any part of the Service</li>
              <li>Use automated systems to access or scrape the Service</li>
              <li>Share your account credentials with others</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>
          </section>

          <section>
            <h2>6. Plan Limits and Feature Access</h2>
            <p>
              Each subscription plan has specific limits on features, including number of menu items, categories, locations, and analytics depth.
              We reserve the right to enforce these limits and may temporarily or permanently restrict access if limits are exceeded.
            </p>
            <p>
              You may upgrade or downgrade your plan once the prior plan expires. Downgrading may result in loss of access to certain features or content that exceeds the new plan's limits.
              We will provide notice before any such loss occurs.
            </p>
          </section>

          <section>
            <h2>7. QR Code Usage</h2>
            <p>
              QR codes generated through our Service are unique to your restaurant and menu. You are responsible for:
            </p>
            <ul>
              <li>Printing and displaying QR codes at your physical location</li>
              <li>Ensuring QR codes remain scannable and accessible</li>
              <li>Updating your menu content appropriately</li>
            </ul>
            <p>
              We guarantee that your QR code will always point to your active menu as long as your account is in good standing.
              If your subscription lapses or is canceled, we reserve the right to redirect your QR code or display a notice.
            </p>
          </section>

          <section>
            <h2>8. Intellectual Property</h2>
            <p>
              The Service, including its code, design, layout, graphics, and logo, is the property of EasyMenu and is protected by copyright,
              trademark, and other intellectual property laws. You may not copy, modify, or create derivative works of the Service without our express written permission.
            </p>
            <p>
              "EasyMenu," the EasyMenu logo, and related marks are trademarks of EasyMenu. You may not use these marks without our prior written consent.
            </p>
          </section>

          <section>
            <h2>9. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including if you breach these Terms.
              Upon termination, your right to use the Service will cease immediately.
            </p>
            <p>
              You may terminate your account at any time by contacting us or using the account deletion feature in your dashboard.
              Upon termination, we will delete your account data in accordance with our data retention policies.
            </p>
          </section>

          <section>
            <h2>10. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied. 
              We do not warrant that the Service will be uninterrupted, error-free, or secure.
            </p>
            <p>
              We do not warrant the accuracy, reliability, or completeness of any content provided through the Service. 
              You assume all risk associated with your use of the Service.
            </p>
          </section>

          <section>
            <h2>11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, EasyMenu shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use the Service.
            </p>
            <p>
              Our total liability to you for any claim arising from these Terms or your use of the Service shall not exceed the amount you have paid us 
              in the past 12 months, or $100 if you have not paid us any amounts.
            </p>
          </section>

          <section>
            <h2>12. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless EasyMenu and its officers, directors, employees, and agents from any claims,
              damages, losses, liabilities, costs, or expenses (including reasonable attorneys' fees) arising from:
            </p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Any content you upload to the Service</li>
            </ul>
          </section>

          <section>
            <h2>13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Nepal, without regard to its conflict of law provisions.
              Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts of Pokhara, Nepal.
            </p>
          </section>

          <section>
            <h2>14. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of any material changes by:
            </p>
            <ul>
              <li>Posting the new Terms on this page</li>
              <li>Sending you an email notification</li>
              <li>Displaying a notice within the Service</li>
            </ul>
            <p>
              Your continued use of the Service after the changes become effective constitutes your acceptance of the new Terms.
              If you do not agree to the new Terms, you must stop using the Service and cancel your account.
            </p>
          </section>

          <section>
            <h2>15. Contact Information</h2>
            <p>If you have any questions about these Terms, please contact us at:</p>
            <ul className="contact-list">
              <li><strong>Email:</strong> <a href="mailto:easymenunepal@gmail.com">easymenunepal@gmail.com</a></li>
              <li><strong>Address:</strong> EasyMenu, Kathmandu, Nepal</li>
            </ul>
          </section>
        </div>

        <div className="legal-footer">
          <Link href="/">Return to Home</Link>
          <span>•</span>
          <Link href="/privacy-policy">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}