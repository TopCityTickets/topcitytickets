import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="ultra-dark-card">
        <CardHeader>
          <CardTitle className="text-4xl font-black brand-text-gradient mb-2">
            Privacy Policy
          </CardTitle>
          <p className="text-muted-foreground">
            Effective Date: December 23, 2024 | Last Updated: December 23, 2024
          </p>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to TopCityTickets (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">2.1 Personal Information</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
                <li><strong>Payment Information:</strong> Processed securely through Stripe (we don&apos;t store credit card details)</li>
                <li><strong>Profile Information:</strong> Any additional information you provide in your profile</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.2 Event and Ticket Information</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li><strong>Purchase History:</strong> Records of tickets you&apos;ve purchased</li>
                <li><strong>Event Creation:</strong> Information about events you create as a seller</li>
                <li><strong>Transaction Data:</strong> Payment amounts, dates, and status</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.3 Automatically Collected Information</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li><strong>Usage Data:</strong> How you interact with our platform</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                <li><strong>Cookies:</strong> See our Cookie Policy section below</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">3.1 Service Provision</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>Process ticket purchases and payments</li>
                <li>Manage your account and provide customer support</li>
                <li>Send transaction confirmations and receipts</li>
                <li>Enable communication between buyers and event organizers</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">3.2 Business Operations</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>Prevent fraud and enhance security</li>
                <li>Improve our platform and user experience</li>
                <li>Analyze usage patterns and trends</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">4.1 We Share Information With:</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li><strong>Stripe:</strong> For payment processing (subject to Stripe&apos;s Privacy Policy)</li>
                <li><strong>Event Organizers:</strong> Basic purchaser information for their events</li>
                <li><strong>Service Providers:</strong> Trusted third parties who assist our operations</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.2 We Do NOT:</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>Sell your personal information to third parties</li>
                <li>Share your information for others&apos; marketing without consent</li>
                <li>Store your payment card information (handled by Stripe)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">5.1 Security Measures</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>SSL encryption for all data transmission</li>
                <li>Secure authentication through Supabase</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and monitoring</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">5.2 Payment Security</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>All payments processed through Stripe&apos;s secure infrastructure</li>
                <li>PCI DSS compliant payment handling</li>
                <li>No storage of sensitive payment information on our servers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights and Choices</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">6.1 Account Management</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li><strong>Access:</strong> View and download your personal information</li>
                <li><strong>Update:</strong> Modify your account information anytime</li>
                <li><strong>Delete:</strong> Request deletion of your account and data</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">6.2 Communication Preferences</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li><strong>Opt-out:</strong> Unsubscribe from marketing emails</li>
                <li><strong>Notifications:</strong> Manage email notification settings</li>
                <li><strong>Essential Communications:</strong> Some communications are required for service operation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking Technologies</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">7.1 Types of Cookies We Use</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
                <li><strong>Analytics Cookies:</strong> Help us understand usage patterns</li>
                <li><strong>Authentication Cookies:</strong> Keep you logged in securely</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Third-Party Services</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">8.1 Integrated Services</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li><strong>Stripe:</strong> Payment processing and Connect marketplace</li>
                <li><strong>Supabase:</strong> Database and authentication services</li>
                <li><strong>Vercel:</strong> Hosting and deployment platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Contact Information</h2>
              
              <div className="bg-muted/20 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-3">Privacy Questions</h3>
                <p className="text-muted-foreground mb-4">
                  For questions about this Privacy Policy or our privacy practices:
                </p>
                <ul className="text-muted-foreground space-y-2">
                  <li><strong>Email:</strong> privacy@topcitytickets.com</li>
                  <li><strong>Response Time:</strong> We aim to respond within 30 days</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. California Privacy Rights (CCPA)</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">California Consumer Rights</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>Right to know what personal information is collected</li>
                <li>Right to delete personal information</li>
                <li>Right to opt-out of sale (we don&apos;t sell information)</li>
                <li>Right to non-discrimination for exercising rights</li>
              </ul>
            </section>

            <section className="bg-muted/10 p-6 rounded-lg">
              <p className="text-center text-muted-foreground">
                <strong>This Privacy Policy is designed to be transparent and comprehensive.</strong><br />
                If you have any questions or concerns, please don&apos;t hesitate to contact us.<br />
                <em>Last updated: December 23, 2024</em>
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
