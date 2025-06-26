import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black/50 border-t border-muted/20 mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold brand-text-gradient">TopCityTickets</h3>
            <p className="text-sm text-muted-foreground">
              Your premier destination for event tickets. Connecting event organizers with ticket buyers.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Browse Events
                </Link>
              </li>
              <li>
                <Link href="/submit-event" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Create Event
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@topcitytickets.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="mailto:help@topcitytickets.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="mailto:sellers@topcitytickets.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Seller Support
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="mailto:legal@topcitytickets.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Legal Inquiries
                </a>
              </li>
            </ul>
          </div>
        </div>        {/* Bottom Bar */}
        <div className="border-t border-muted/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TopCityTickets. All rights reserved.
            </p>
            <div className="bg-yellow-500/20 px-2 py-1 rounded-full">
              <span className="text-yellow-400 text-xs font-semibold">BETA VERSION</span>
            </div>
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms-of-service" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Terms
            </Link>
            <a href="mailto:legal@topcitytickets.com" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Legal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
