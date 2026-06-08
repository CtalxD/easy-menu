// frontend/app/privacy-policy/page.tsx
"use client";

import Link from "next/link";
import { ArrowLeft, QrCode } from "lucide-react";
import "./privacy-policy.css";

export default function PrivacyPolicyPage() {
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
          <h1>Privacy Policy</h1>
          <p className="legal-date">Last Updated: June 8, 2026</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Introduction</h2>
            <p>
              Welcome to EasyMenu ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our digital menu platform.
            </p>
            <p>
              Please read this privacy policy carefully. By accessing or using our services, you acknowledge that you have read, 
              understood, and agree to be bound by the terms of this privacy policy.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Personal Information You Provide</h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li>Name and email address</li>
              <li>Restaurant name and business details</li>
              <li>Phone number and address</li>
              <li>Password (encrypted)</li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <p>When you use our service, we automatically collect:</p>
            <ul>
              <li>Device information (type, browser, operating system)</li>
              <li>IP address and location data</li>
              <li>Usage data (menu views, feature usage)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3>2.3 Information from Restaurant Customers</h3>
            <p>
              When customers scan your QR code and view your menu, we collect anonymized view data including:
            </p>
            <ul>
              <li>Device type (mobile, tablet, desktop)</li>
              <li>Time and date of view</li>
              <li>Restaurant location (if applicable)</li>
              <li>No personally identifiable information is collected from menu viewers</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Create and manage your restaurant account</li>
              <li>Provide, maintain, and improve our services</li>
              <li>Generate and customize QR codes for your menu</li>
              <li>Process payments and manage subscriptions</li>
              <li>Analyze usage patterns and optimize performance</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Protect against fraud and unauthorized transactions</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2>4. Sharing Your Information</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:</p>
            
            <h3>4.1 Service Providers</h3>
            <p>
              We may share your information with third-party vendors who perform services on our behalf, such as:
            </p>
            <ul>
              <li>Payment processing (Stripe, PayPal, etc.)</li>
              <li>Cloud hosting and database services</li>
              <li>Email delivery services</li>
              <li>Analytics providers</li>
            </ul>
            <p>These providers have access to your information only to perform these tasks and are obligated not to disclose or use it for any other purpose.</p>

            <h3>4.2 Legal Requirements</h3>
            <p>We may disclose your information if required to do so by law or in response to valid requests by public authorities.</p>

            <h3>4.3 Business Transfers</h3>
            <p>
              If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
              We will notify you of any such change in ownership or control of your personal information.
            </p>
          </section>

          <section>
            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. These include:
            </p>
            <ul>
              <li>Encryption of sensitive data (passwords, payment information)</li>
              <li>Secure HTTPS connections for all data transmission</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication requirements</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. 
              While we strive to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2>6. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you with services.
              We may also retain and use your information to comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>
            <p>You may delete your account at any time, which will remove most of your personal information from our active databases.</p>
          </section>

          <section>
            <h2>7. Your Rights and Choices</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Request corrections to inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Opt-out:</strong> Opt-out of marketing communications</li>
            </ul>
            <p>To exercise these rights, please contact us at <a href="mailto:easymenunepal@gmail.com">easymenunepal@gmail.com</a>.</p>
          </section>

          <section>
            <h2>8. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our service and store certain information.
              Cookies are small data files stored on your device. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
            <p>Types of cookies we use:</p>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for the service to function (authentication, security)</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our service</li>
            </ul>
          </section>

          <section>
            <h2>9. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2>10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and maintained on servers located outside of your country of residence.
              By using our service, you consent to the transfer of your data to countries that may have different data protection laws.
            </p>
          </section>

          <section>
            <h2>11. Third-Party Links</h2>
            <p>
              Our service may contain links to third-party websites. We are not responsible for the privacy practices or content of these third-party sites.
              We encourage you to read the privacy policies of any linked websites you visit.
            </p>
          </section>

          <section>
            <h2>12. Changes to This Privacy Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page
              and updating the "Last Updated" date. We will also notify you via email or through a notice on our service for material changes.
            </p>
            <p>You are advised to review this privacy policy periodically for any changes.</p>
          </section>

          <section>
            <h2>13. Contact Us</h2>
            <p>If you have any questions about this privacy policy or our data practices, please contact us at:</p>
            <ul className="contact-list">
              <li><strong>Email:</strong> <a href="mailto:easymenunepal@gmail.com">easymenunepal@gmail.com</a></li>
              <li><strong>Address:</strong> EasyMenu, Kathmandu, Nepal</li>
            </ul>
          </section>
        </div>

        <div className="legal-footer">
          <Link href="/">Return to Home</Link>
          <span>•</span>
          <Link href="/terms-of-service">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}