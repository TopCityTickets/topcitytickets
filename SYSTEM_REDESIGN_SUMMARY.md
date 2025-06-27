# TopCityTickets Complete System Redesign

## 🎯 Business Requirements Implemented

### User Types & Workflows
1. **Anonymous Users** - Can purchase tickets without signing up
2. **Regular Users** - Signed up users who can purchase tickets
3. **Seller Applicants** - Applied but awaiting approval
4. **Approved Sellers** - Can submit events for admin approval
5. **Denied Sellers** - Must wait 1 week before reapplying
6. **Admins** - Can approve sellers and events, manage system

### Key Features
- ✅ Anonymous ticket purchasing with Stripe
- ✅ Seller application workflow with 1-week denial cooldown
- ✅ Event submission → Admin approval → Live event creation
- ✅ Automatic escrow system (money held until day after event)
- ✅ Ticket inventory management
- ✅ Event editing permissions (sellers: own events, admins: all)
- ✅ Refund system for cancelled events

## 📊 Database Schema

### Core Tables
1. **users** - Handles both registered and anonymous users
2. **anonymous_purchases** - For users who don't want to sign up
3. **event_submissions** - Seller requests awaiting approval
4. **events** - Live, approved events with tickets for sale
5. **tickets** - Links to either user_id or anonymous_purchase_id
6. **escrow_holds** - Money held until day after event
7. **escrow_payments** - Individual payment tracking
8. **seller_stripe_accounts** - Stripe Connect integration
9. **customer_payment_methods** - Saved payment methods

### Automated Systems
- **Triggers** automatically create escrow holds when events are approved
- **Triggers** update escrow totals when tickets are purchased
- **Functions** handle seller applications with cooldown periods
- **Functions** approve events and create live pages
- **RLS Policies** ensure proper data access control

## 🔧 API Endpoints

### User Management
- `POST /api/manual-signup` - User registration
- `GET/POST /api/seller-application` - Apply for seller status

### Event Management
- `GET/POST /api/event-submissions` - Submit events for approval
- `POST /api/admin/reviews` - Admin approval/denial system
- `GET /api/admin/reviews` - Get pending reviews

### Ticket Sales
- `POST /api/purchase-ticket` - Anonymous or registered ticket purchase
- Automatic escrow system with Stripe Connect
- Platform fee calculation (2.9%)

## 💰 Revenue Model

### Escrow System
1. Customer pays for ticket → Money goes to escrow
2. Platform fee (2.9%) calculated automatically  
3. Remaining amount allocated to seller
4. Money held until day after event
5. If event cancelled → automatic refunds
6. If event successful → seller paid out

### Stripe Integration
- **Stripe Connect** for seller payouts
- **Stripe Treasury** for escrow holding
- **Payment Intents** for secure transactions
- **Webhooks** for payment status updates

## 🚀 Deployment Steps

### 1. Database Migration
Run `complete-system-redesign.sql` in Supabase SQL Editor

### 2. Frontend Updates
- Update imports to use new types from `database-redesign.types.ts`
- Test new API endpoints
- Update forms for seller applications and event submissions

### 3. Stripe Configuration
- Set up Stripe Connect for sellers
- Configure webhook endpoints
- Test escrow flow in sandbox

### 4. Testing Checklist
- [ ] Anonymous ticket purchase
- [ ] Registered user ticket purchase  
- [ ] Seller application workflow
- [ ] Event submission and approval
- [ ] Escrow money flow
- [ ] Refund system
- [ ] Admin dashboard functionality

## 📱 User Journeys

### Anonymous Buyer
1. Browse events → Select event → Enter email/info → Pay → Get ticket

### Registered User  
1. Sign up → Browse events → Buy tickets → View in dashboard

### Seller Journey
1. Sign up → Apply for seller → Get approved → Submit events → Get approved → Manage events

### Admin Journey
1. Review seller applications → Approve/deny
2. Review event submissions → Approve/deny  
3. Manage escrow releases → Handle refunds

## 🔐 Security Features

- **Row Level Security** on all tables
- **Service role** API access for sensitive operations
- **User role validation** for all admin functions
- **Escrow protection** prevents direct seller access to funds
- **Anonymous purchase isolation** from registered users

## 🎉 Key Improvements

1. **Simplified User Flow** - Anonymous purchases remove signup friction
2. **Automated Escrow** - Protects buyers and ensures seller payment
3. **Proper Role Management** - Clear seller application process
4. **Event Approval Workflow** - Admin control over event quality
5. **Scalable Architecture** - Handles high transaction volumes
6. **Revenue Protection** - Platform fees automatically calculated

This system now matches your exact business requirements and provides a complete ticketing platform with anonymous purchases, seller management, and automated escrow!
