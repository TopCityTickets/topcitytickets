import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailTemplate) {
  if (!resend) {
    console.error('Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'TopCityTickets <notifications@topcitytickets.org>',
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Email sending error:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
}

// Email Templates
export const emailTemplates = {
  sellerApproved: (name: string, email: string) => ({
    to: email,
    subject: '🎉 Your TopCityTickets Seller Application Has Been Approved!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Seller Application Approved</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #1a0d3d 0%, #0f0827 40%, #020204 80%, #000000 100%);
              margin: 0;
              padding: 20px;
              color: #ffffff;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: rgba(15, 8, 39, 0.8);
              border-radius: 12px;
              border: 1px solid rgba(233, 70, 231, 0.3);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, rgba(233, 70, 231, 0.2), rgba(79, 124, 255, 0.2));
              padding: 30px;
              text-align: center;
              border-bottom: 1px solid rgba(233, 70, 231, 0.2);
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              background: linear-gradient(135deg, #E946E7, #4F7CFF, #FFD700);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 10px;
            }
            .content {
              padding: 30px;
            }
            .success-icon {
              text-align: center;
              font-size: 48px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #E946E7;
            }
            .message {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 25px;
              color: #e0e0e0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #E946E7, #4F7CFF);
              color: white;
              text-decoration: none;
              padding: 12px 30px;
              border-radius: 8px;
              font-weight: bold;
              text-align: center;
              margin: 10px 0;
            }
            .features {
              background: rgba(233, 70, 231, 0.1);
              border: 1px solid rgba(233, 70, 231, 0.2);
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .feature-item {
              display: flex;
              align-items: center;
              margin-bottom: 10px;
            }
            .feature-icon {
              margin-right: 10px;
              color: #FFD700;
            }
            .footer {
              padding: 20px 30px;
              border-top: 1px solid rgba(233, 70, 231, 0.2);
              text-align: center;
              font-size: 14px;
              color: #a0a0a0;
            }
            .beta-notice {
              background: rgba(251, 191, 36, 0.1);
              border: 1px solid rgba(251, 191, 36, 0.3);
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              color: rgb(251, 191, 36);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">TopCityTickets</div>
              <div style="color: #e0e0e0;">Event Ticketing Platform</div>
            </div>
            
            <div class="content">
              <div class="success-icon">🎉</div>
              
              <h1 class="title">Congratulations ${name}!</h1>
              
              <p class="message">
                Your seller application has been <strong>approved</strong>! You can now start submitting and managing events on TopCityTickets.
              </p>
              
              <div class="features">
                <h3 style="color: #E946E7; margin-top: 0;">What you can do now:</h3>
                <div class="feature-item">
                  <span class="feature-icon">🎫</span>
                  <span>Submit events for review and approval</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📊</span>
                  <span>Access your seller dashboard</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">✏️</span>
                  <span>Edit and manage your events</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">💰</span>
                  <span>Track ticket sales and revenue</span>
                </div>
              </div>
              
              <div class="beta-notice">
                <strong>🚀 Beta Program:</strong> Some features like direct payouts are pending Stripe Connect approval and will be available soon.
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://topcitytickets.org/seller/dashboard" class="cta-button">
                  Access Your Dashboard
                </a>
              </div>
              
              <p class="message">
                Ready to create your first event? Head to your dashboard and click "Submit New Event" to get started!
              </p>
            </div>
            
            <div class="footer">
              <p>
                Questions? Reply to this email or contact us at 
                <a href="mailto:support@topcitytickets.org" style="color: #E946E7;">support@topcitytickets.org</a>
              </p>
              <p>
                TopCityTickets &copy; 2025 - Making events accessible to everyone
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  sellerRejected: (name: string, email: string, reason?: string) => ({
    to: email,
    subject: 'TopCityTickets Seller Application Update',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Seller Application Update</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #1a0d3d 0%, #0f0827 40%, #020204 80%, #000000 100%);
              margin: 0;
              padding: 20px;
              color: #ffffff;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: rgba(15, 8, 39, 0.8);
              border-radius: 12px;
              border: 1px solid rgba(239, 68, 68, 0.3);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(79, 124, 255, 0.2));
              padding: 30px;
              text-align: center;
              border-bottom: 1px solid rgba(239, 68, 68, 0.2);
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              background: linear-gradient(135deg, #E946E7, #4F7CFF, #FFD700);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 10px;
            }
            .content {
              padding: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #ef4444;
            }
            .message {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 25px;
              color: #e0e0e0;
            }
            .reason-box {
              background: rgba(239, 68, 68, 0.1);
              border: 1px solid rgba(239, 68, 68, 0.2);
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #E946E7, #4F7CFF);
              color: white;
              text-decoration: none;
              padding: 12px 30px;
              border-radius: 8px;
              font-weight: bold;
              text-align: center;
              margin: 10px 0;
            }
            .footer {
              padding: 20px 30px;
              border-top: 1px solid rgba(239, 68, 68, 0.2);
              text-align: center;
              font-size: 14px;
              color: #a0a0a0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">TopCityTickets</div>
              <div style="color: #e0e0e0;">Event Ticketing Platform</div>
            </div>
            
            <div class="content">
              <h1 class="title">Application Update</h1>
              
              <p class="message">
                Hi ${name},
              </p>
              
              <p class="message">
                Thank you for your interest in becoming a seller on TopCityTickets. After reviewing your application, we're unable to approve it at this time.
              </p>
              
              ${reason ? `
                <div class="reason-box">
                  <h3 style="color: #ef4444; margin-top: 0;">Reason:</h3>
                  <p style="margin-bottom: 0;">${reason}</p>
                </div>
              ` : ''}
              
              <p class="message">
                Don't worry! You can still enjoy all the features as a regular user, including purchasing tickets for events and submitting events for consideration.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://topcitytickets.org/events" class="cta-button">
                  Browse Events
                </a>
              </div>
              
              <p class="message">
                If you believe this was an error or have additional information to share, feel free to contact our support team.
              </p>
            </div>
            
            <div class="footer">
              <p>
                Questions? Contact us at 
                <a href="mailto:support@topcitytickets.org" style="color: #E946E7;">support@topcitytickets.org</a>
              </p>
              <p>
                TopCityTickets &copy; 2025 - Making events accessible to everyone
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  eventApproved: (eventName: string, organizerEmail: string, eventUrl: string) => ({
    to: organizerEmail,
    subject: `🎉 Your Event "${eventName}" Has Been Approved!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Approved</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #1a0d3d 0%, #0f0827 40%, #020204 80%, #000000 100%);
              margin: 0;
              padding: 20px;
              color: #ffffff;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: rgba(15, 8, 39, 0.8);
              border-radius: 12px;
              border: 1px solid rgba(233, 70, 231, 0.3);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, rgba(233, 70, 231, 0.2), rgba(79, 124, 255, 0.2));
              padding: 30px;
              text-align: center;
              border-bottom: 1px solid rgba(233, 70, 231, 0.2);
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              background: linear-gradient(135deg, #E946E7, #4F7CFF, #FFD700);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 10px;
            }
            .content {
              padding: 30px;
            }
            .success-icon {
              text-align: center;
              font-size: 48px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #E946E7;
            }
            .message {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 25px;
              color: #e0e0e0;
            }
            .event-name {
              background: linear-gradient(135deg, rgba(233, 70, 231, 0.2), rgba(79, 124, 255, 0.2));
              border: 1px solid rgba(233, 70, 231, 0.3);
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #E946E7, #4F7CFF);
              color: white;
              text-decoration: none;
              padding: 12px 30px;
              border-radius: 8px;
              font-weight: bold;
              text-align: center;
              margin: 10px 0;
            }
            .footer {
              padding: 20px 30px;
              border-top: 1px solid rgba(233, 70, 231, 0.2);
              text-align: center;
              font-size: 14px;
              color: #a0a0a0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">TopCityTickets</div>
              <div style="color: #e0e0e0;">Event Ticketing Platform</div>
            </div>
            
            <div class="content">
              <div class="success-icon">🎉</div>
              
              <h1 class="title">Your Event is Live!</h1>
              
              <div class="event-name">
                <h2 style="margin: 0; color: #FFD700;">${eventName}</h2>
              </div>
              
              <p class="message">
                Great news! Your event has been approved and is now live on TopCityTickets. People can start buying tickets immediately!
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${eventUrl}" class="cta-button">
                  View Your Event Page
                </a>
              </div>
              
              <p class="message">
                Share the event link with your audience and start selling tickets. You can track sales and manage your event from your dashboard.
              </p>
            </div>
            
            <div class="footer">
              <p>
                Questions? Contact us at 
                <a href="mailto:support@topcitytickets.org" style="color: #E946E7;">support@topcitytickets.org</a>
              </p>
              <p>
                TopCityTickets &copy; 2025 - Making events accessible to everyone
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};
