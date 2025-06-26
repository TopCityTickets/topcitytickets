import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="ultra-dark-card">
        <CardHeader>
          <CardTitle className="text-4xl font-black brand-text-gradient mb-2">
            Terms of Service
          </CardTitle>
          <p className="text-muted-foreground">
            Effective Date: December 23, 2024 | Last Updated: December 23, 2024
          </p>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using TopCityTickets (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                TopCityTickets is an online marketplace platform that connects event organizers with ticket buyers. Our services include:
              </p>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>Event listing and discovery</li>
                <li>Secure ticket purchasing and payment processing</li>
                <li>Event management tools for organizers</li>
                <li>Customer support and dispute resolution</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">3.1 Account Creation</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must be at least 18 years old to create an account</li>
                <li>One person may not maintain multiple accounts</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">3.2 Account Responsibilities</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>Keep your login credentials confidential</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>You are liable for all activities under your account</li>
                <li>We may suspend or terminate accounts for violations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Event Organizers and Sellers</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">4.1 Seller Application</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>Must apply and be approved as a seller</li>
                <li>Provide accurate business and contact information</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Maintain appropriate licenses and permits</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.2 Event Listings</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>Provide accurate event information and descriptions</li>
                <li>Honor all ticket sales and event commitments</li>
                <li>Handle customer service for your events</li>
                <li>Comply with venue and local regulations</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.3 Fees and Payments</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>5% platform fee on all ticket sales</li>
                <li>Stripe processing fees apply</li>
                <li>Payments held in escrow for 24 hours after purchase</li>
                <li>Automatic payouts to connected Stripe accounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Ticket Purchases</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">5.1 Purchase Process</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>All sales are final unless otherwise specified</li>
                <li>Tickets are non-transferable unless stated otherwise</li>
                <li>You must provide accurate payment information</li>
                <li>Confirmation will be sent via email</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">5.2 Refunds and Cancellations</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>Refunds available only before event start time</li>
                <li>Event organizers and admins can process refunds</li>
                <li>Cancelled events receive automatic full refunds</li>
                <li>Processing may take 5-10 business days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Prohibited Activities</h2>
              
              <p className="text-muted-foreground mb-4">You may not use our service to:</p>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Create fraudulent or misleading listings</li>
                <li>Engage in ticket scalping or price manipulation</li>
                <li>Harass or abuse other users</li>
                <li>Interfere with platform operations</li>
                <li>Use automated tools to access the service</li>
                <li>Create multiple accounts to circumvent restrictions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Content and Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">7.1 User Content</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>You retain ownership of content you upload</li>
                <li>You grant us license to use content for platform operations</li>
                <li>You are responsible for content legality and accuracy</li>
                <li>We may remove content that violates these terms</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">7.2 Platform Content</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>TopCityTickets platform and features are our property</li>
                <li>You may not copy, modify, or distribute our content</li>
                <li>Our trademarks and logos are protected</li>
                <li>Limited license granted for personal use only</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Privacy and Data Protection</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices regarding the collection and use of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Disclaimers and Limitations of Liability</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">9.1 Service Disclaimer</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>Service provided &quot;as is&quot; without warranties</li>
                <li>We do not guarantee uninterrupted service</li>
                <li>We are not responsible for event quality or performance</li>
                <li>Third-party services may have their own terms</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">9.2 Limitation of Liability</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>Liability limited to the amount of fees paid to us</li>
                <li>Not liable for indirect or consequential damages</li>
                <li>Not responsible for disputes between users</li>
                <li>Force majeure events exclude our liability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Dispute Resolution</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">10.1 Customer Support</h3>
              <p className="text-muted-foreground mb-4">
                For disputes or issues, please contact our customer support team first. We will work to resolve issues promptly and fairly.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3">10.2 Arbitration</h3>
              <p className="text-muted-foreground">
                Any disputes that cannot be resolved through customer support will be settled through binding arbitration in accordance with applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Termination</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">11.1 Account Termination</h3>
              <ul className="text-muted-foreground space-y-2 ml-6">
                <li>You may delete your account at any time</li>
                <li>We may suspend or terminate accounts for violations</li>
                <li>Termination does not affect existing ticket obligations</li>
                <li>Some data may be retained for legal compliance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Material changes will be communicated via email or platform notification. Continued use of the service constitutes acceptance of modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact Information</h2>
              
              <div className="bg-muted/20 p-6 rounded-lg">
                <p className="text-muted-foreground mb-4">
                  For questions about these Terms of Service:
                </p>
                <ul className="text-muted-foreground space-y-2">
                  <li><strong>Email:</strong> legal@topcitytickets.com</li>
                  <li><strong>Support:</strong> support@topcitytickets.com</li>
                </ul>
              </div>
            </section>

            <section className="bg-muted/10 p-6 rounded-lg">
              <p className="text-center text-muted-foreground">
                <strong>By using TopCityTickets, you acknowledge that you have read and agree to these Terms of Service.</strong><br />
                <em>Last updated: December 23, 2024</em>
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
