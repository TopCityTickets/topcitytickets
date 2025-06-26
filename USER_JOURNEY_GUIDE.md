# TopCityTickets: User Journey & Setup Guide

## 🎯 **Complete User Flow**

### **For Regular Users (Event Attendees)**
1. **Sign Up** → Get 'user' role automatically
2. **Browse Events** → Find events you want to attend  
3. **Purchase Tickets** → Secure checkout with Stripe
4. **Manage Tickets** → View/refund tickets in dashboard

### **For Event Organizers (Sellers)**
1. **Sign Up** → Get 'user' role automatically
2. **Apply for Seller Status** → No payment setup required initially
3. **Wait for Admin Approval** → Admin reviews application
4. **Access Seller Dashboard** → Get seller permissions
5. **Connect Bank Account** → Set up Stripe Connect for payments
6. **Submit Events** → Create events after payment setup
7. **Receive Payouts** → Get payments within 24 hours of sales

---

## ⚙️ **Payment Setup Flow**

### **Seller Onboarding Sequence:**
```
User Role → Apply for Seller → Admin Approval → Stripe Connect → Submit Events
```

### **Why This Flow:**
- **Lower Barrier**: Users can apply without payment details
- **Better Security**: Only approved sellers handle money
- **Compliance**: Stripe Connect requires business verification
- **User Experience**: Clear progression with gated features

---

## 🔒 **Security & Permissions**

### **RBAC System:**
- **JWT-based**: Role checking via access token claims
- **Database Trigger**: Auto-assign 'user' role on signup
- **Fallback Logic**: Database query if JWT fails
- **Single Source**: All permissions flow through `user_roles` table

### **Payment Security:**
- **Stripe Connect**: Separate seller accounts
- **PCI Compliance**: All handled by Stripe
- **Escrow**: Platform fees deducted automatically
- **RLS Policies**: Row-level security on all payment tables

---

## 📋 **Required SQL Scripts**

### **1. RBAC Integration** (`complete-rbac-integration.sql`)
```sql
-- Auto-assign roles to new users
-- Enable JWT-based role checking
-- Set up triggers and permissions
```

### **2. Payment System** (`safe-user-payment-system.sql`)
```sql
-- User payment methods table
-- Stripe Connect accounts table
-- RLS policies for security
```

### **3. Test Integration** (`test-integration.sql`)
```sql
-- Verify RBAC tables exist
-- Check triggers are working
-- Validate RLS policies
```

---

## 🚀 **Environment Variables**

### **Required in `.env.local`:**
```bash
# Stripe Connect
STRIPE_CONNECT_CLIENT_ID=ca_your_stripe_connect_client_id
PLATFORM_FEE_PERCENTAGE=5

# Stripe Standard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
```

---

## ✅ **Testing Checklist**

### **New User Signup:**
- [ ] User gets 'user' role automatically
- [ ] Can apply for seller status without payment setup
- [ ] Redirected to welcome page on first login

### **Seller Application:**
- [ ] User can submit seller application
- [ ] Admin can approve/reject in admin dashboard
- [ ] Approved users get seller role and access

### **Stripe Connect Flow:**
- [ ] Seller dashboard shows payment setup requirement
- [ ] Cannot submit events without bank account
- [ ] Stripe onboarding flow works correctly
- [ ] Payment status updates in real-time

### **Event Submission:**
- [ ] Gated behind Stripe Connect completion
- [ ] Form only appears after payment setup
- [ ] Clear messaging about requirements

---

## 🎉 **Benefits of This System**

### **For Users:**
- **Easy Signup**: No payment required to start
- **Clear Path**: Step-by-step seller onboarding
- **Secure**: All payments handled professionally

### **For Platform:**
- **Compliance**: Proper payment handling
- **Security**: Role-based access control
- **Scalable**: Supports thousands of sellers
- **Professional**: Stripe Connect marketplace

### **For Sellers:**
- **Fast Payouts**: 24-hour payment processing
- **Low Friction**: Apply first, setup later
- **Professional**: Branded payment experience
- **Analytics**: Detailed payment reporting

---

*This system ensures a smooth user experience while maintaining security, compliance, and professional payment processing.*
