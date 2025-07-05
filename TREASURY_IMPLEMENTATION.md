# Stripe Treasury Integration Implementation

## Overview
This document outlines the Stripe Treasury integration implemented for TopCityTickets' escrow and payout system.

## Business Model: Platform
- **Model**: Platform (not marketplace)
- **Money Flow**: Buyer → Platform → Escrow → Seller (after event completion)
- **Control**: Platform controls fund timing and releases
- **Fees**: 5% platform fee + Stripe fees

## What Was Implemented

### 1. Database Schema Updates
**File**: `supabase/migrations/003_add_stripe_treasury_fields.sql`
**New Fields Added to `users` table**:
- `stripe_financial_account_id` (TEXT) - Stripe Treasury Financial Account ID
- `stripe_treasury_enabled` (BOOLEAN) - Whether Treasury is enabled for this seller

**New Fields Added to `escrow_holds` table**:
- `financial_account_id` (TEXT) - Associated Stripe Financial Account
- `inbound_transfer_id` (TEXT) - Treasury inbound transfer ID for escrow funding
- `outbound_transfer_id` (TEXT) - Treasury outbound transfer ID for seller payout
- `released_at` (TIMESTAMPTZ) - When escrow was released
- `released_by` (UUID) - Admin who released the escrow

### 2. Treasury Service
**File**: `src/lib/stripe-treasury.ts`
**Key Functions**:
- `createFinancialAccount()` - Create Treasury financial account for sellers
- `getFinancialAccount()` - Get account details and balance
- `createInboundTransfer()` - Move funds into financial account (escrow)
- `createOutboundTransfer()` - Move funds out of financial account (payout)
- `checkTreasuryCapability()` - Verify if account supports Treasury
- `simulateReceivedCredit()` - Test mode funding simulation

### 3. API Endpoints Created

#### Treasury Management
- **POST** `/api/stripe/treasury/create-financial-account` - Create financial account for approved sellers
- **GET** `/api/stripe/treasury/status` - Check seller's Treasury account status

#### Escrow Management  
- **POST** `/api/escrow/create` - Create escrow hold when ticket is purchased
- **POST** `/api/escrow/release` - Release escrow funds to seller (admin only)
- **GET** `/api/escrow/release` - List escrow holds for admin review

#### Testing
- **GET** `/api/test-treasury` - Test Treasury integration

### 4. Updated Admin Review Process
**File**: `src/app/api/admin/reviews/route.ts`
**Enhancement**: When approving seller applications, automatically attempts to create Treasury financial account if:
- Seller has Stripe Connect account
- Treasury capability is available
- No existing financial account

### 5. Database Types Updated
**File**: `src/types/database.types.ts`
**Added**: Treasury-related fields to users table type definitions

## Integration Flow

### 1. Seller Approval Process
```
1. User applies to become seller
2. Admin approves application
3. User role changed to 'seller'
4. System automatically creates Treasury financial account (if possible)
5. Seller can now receive escrow payments
```

### 2. Ticket Purchase with Escrow
```
1. Customer purchases ticket
2. Payment processed via Stripe Connect
3. Escrow hold created in database
4. If seller has Treasury: funds moved to financial account
5. If no Treasury: regular escrow tracking
6. Funds held until event completion
```

### 3. Payout Process (Post-Event)
```
1. Admin reviews completed events
2. Admin releases escrow holds
3. If Treasury enabled: automatic payout to seller's bank
4. If no Treasury: manual payout required
5. Platform fee retained by platform
```

## Configuration Required

### Environment Variables
```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
PLATFORM_FEE_PERCENTAGE=5
```

### Stripe Dashboard Setup
1. **Business Model**: Select "Platform" (not marketplace)
2. **Stripe Connect**: Enable for connected accounts
3. **Treasury**: Apply for access (required for financial accounts)
4. **Webhooks**: Configure for Treasury events

### Database Migration
Run the SQL in `treasury_migration_manual.sql` in Supabase SQL Editor to add Treasury fields.

## Treasury Capabilities

### What Treasury Provides
- **Escrow Functionality**: Hold funds in separate financial accounts
- **Automated Payouts**: Direct bank transfers to sellers
- **Balance Management**: Track available vs pending funds
- **Transaction History**: Complete audit trail
- **Compliance**: Built-in financial regulations handling

### Fallback Behavior
If Treasury is not available or fails:
- System falls back to regular escrow tracking
- Manual payouts required via Stripe Dashboard
- All business logic still functions

## Testing

### Test Mode Features
- `simulateReceivedCredit()` - Add test funds to financial accounts
- All Treasury APIs work in test mode
- No real money transfers in test environment

### API Test Endpoint
`GET /api/test-treasury` - Verify Treasury integration is working

## Next Steps

1. **Apply for Treasury Access**: Contact Stripe to enable Treasury for your account
2. **Run Migration**: Execute the SQL migration to add Treasury fields
3. **Test Integration**: Use test mode to verify escrow and payout flows
4. **Configure Webhooks**: Set up Treasury webhook endpoints for status updates
5. **Admin Dashboard**: Build UI for managing escrow holds and payouts
6. **Seller Dashboard**: Show Treasury account status and balance

## Notes

- Treasury may not be available for all connected accounts (regional restrictions)
- System gracefully handles Treasury unavailability
- Platform fee (5%) is retained by the platform, seller amount goes to Treasury
- All Treasury operations are logged for audit purposes
- Test mode allows full testing without real money movement
