# Email Notifications Setup & Usage

## Overview
TopCityTickets now supports automated email notifications for seller applications and event approvals using Resend.

## Setup

### 1. Get a Resend API Key
1. Sign up at [Resend.com](https://resend.com)
2. Create a new API key in your dashboard
3. Copy the API key (starts with `re_`)

### 2. Add Environment Variable
Add this to your `.env.local` file:
```bash
RESEND_API_KEY=re_your_actual_api_key_here
```

### 3. Verify Domain (Production)
For production, you'll need to verify your sending domain in Resend:
1. Add your domain in Resend dashboard
2. Add the required DNS records
3. Update the `from` address in `src/lib/email.ts` to use your verified domain

## Available Email Templates

### Seller Application Notifications
- **Approved**: Congratulatory email with next steps
- **Rejected**: Polite rejection with optional reason

### Event Notifications  
- **Approved**: Event approval confirmation with shareable URL

## How It Works

### Admin Dashboard Integration
When an admin approves or rejects a seller application:
1. The application status is updated in the database
2. User role is updated to 'seller' if approved
3. An email notification is automatically sent
4. Admin sees confirmation that email was sent

### Manual API Usage
You can also send notifications via the API endpoint:

```javascript
// Send seller approval notification
const response = await fetch('/api/send-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    type: 'seller_approved',
    userId: 'user-uuid'
  })
});

// Send seller rejection notification  
const response = await fetch('/api/send-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    type: 'seller_rejected',
    userId: 'user-uuid',
    reason: 'Optional rejection reason'
  })
});

// Send event approval notification
const response = await fetch('/api/send-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    type: 'event_approved',
    userId: 'user-uuid',
    eventName: 'Event Name',
    eventUrl: 'https://topcitytickets.com/events/event-slug'
  })
});
```

## Email Template Features

### Design
- Modern gradient design matching TopCityTickets branding
- Responsive HTML emails that work across email clients
- BETA branding included to match the platform

### Content
- Personalized greetings using user's name
- Clear call-to-action buttons
- Platform feature highlights
- Professional footer with contact information

## Testing

### Development
1. Set up your Resend API key in `.env.local`
2. Go to Admin Dashboard → Seller Applications
3. Approve or reject a seller application
4. Check the console for email sending logs
5. Check the recipient's email inbox

### Production Checklist
- [ ] Resend API key configured
- [ ] Domain verified in Resend
- [ ] From email address updated to verified domain
- [ ] Test email delivery with real accounts
- [ ] Monitor email delivery rates in Resend dashboard

## Troubleshooting

### Email Not Sending
1. Check if `RESEND_API_KEY` is set in environment variables
2. Verify API key is valid in Resend dashboard
3. Check server logs for error messages
4. Ensure from domain is verified (production)

### Email Going to Spam
1. Set up SPF, DKIM, and DMARC records for your domain
2. Use a verified domain in the from address
3. Avoid spam trigger words in subject lines
4. Monitor your sender reputation

### API Errors
- `401 Unauthorized`: Authorization header missing
- `404 User not found`: Invalid userId provided
- `400 Invalid notification type`: Check the type parameter
- `500 Failed to send email`: Check Resend configuration

## Future Enhancements

Potential improvements for the email system:
- Welcome emails for new users
- Password reset emails
- Ticket purchase confirmations
- Event reminder emails
- Payment confirmation emails
- Monthly newsletters for sellers
