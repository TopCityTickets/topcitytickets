# 🚀 TopCityTickets Complete System Migration Guide

## Error Resolution: "column seller_status does not exist"

The error occurred because the migration was trying to reference columns that didn't exist yet. I've created a **step-by-step migration** to fix this properly.

## 📋 Migration Steps (Run in Order)

### Step 1: Add Missing Columns to Users Table
**File:** `step1-add-user-columns.sql`
- Safely adds all missing columns to the existing users table
- Handles existing constraints properly
- Adds updated_at trigger

### Step 2: Create New Tables
**File:** `step2-create-new-tables.sql`
- Creates all new tables for the redesigned system
- Handles existing tables gracefully (adds missing columns)
- Sets up proper relationships

### Step 3: Create Functions and Triggers
**File:** `step3-create-functions.sql`
- Drops conflicting functions first
- Creates all business logic functions
- Sets up automated triggers for escrow system

### Step 4: Add Indexes and Security
**File:** `step4-indexes-security.sql`
- Creates performance indexes
- Sets up Row Level Security policies
- Finalizes the migration

## 🔧 How to Run the Migration

### In Supabase SQL Editor:

1. **Step 1:** Copy and paste `step1-add-user-columns.sql` → Execute
2. **Step 2:** Copy and paste `step2-create-new-tables.sql` → Execute  
3. **Step 3:** Copy and paste `step3-create-functions.sql` → Execute
4. **Step 4:** Copy and paste `step4-indexes-security.sql` → Execute

### Verify Each Step:
After each step, check that it completed without errors before proceeding to the next.

## 🎯 What This Migration Achieves

### ✅ Database Schema
- **users** table updated with seller workflow columns
- **anonymous_purchases** for non-signup ticket buying
- **event_submissions** for seller → admin approval workflow
- **events** updated for live, approved events
- **tickets** supports both registered and anonymous users
- **escrow_holds** & **escrow_payments** for money management

### ✅ Business Logic
- Seller application with 1-week denial cooldown
- Event submission → admin approval → live event creation
- Automatic escrow system with 2.9% platform fee
- Anonymous ticket purchasing workflow
- Proper role-based permissions

### ✅ Automated Systems
- Triggers create escrow holds when events go live
- Triggers update escrow totals when tickets are sold
- Functions handle seller applications and event approvals
- RLS policies ensure data security

## 🔍 After Migration Testing

1. **Check Users Table:**
   ```sql
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = 'users' 
   ORDER BY ordinal_position;
   ```

2. **Test Seller Application:**
   ```sql
   SELECT apply_for_seller('your-user-id-here');
   ```

3. **Check New Tables:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('anonymous_purchases', 'event_submissions', 'escrow_holds');
   ```

## 🚨 Rollback Plan

If anything goes wrong, you can rollback by:
1. Restore from a Supabase backup (recommended)
2. Or manually drop the added columns and tables

## 📞 Next Steps After Migration

1. **Update Frontend:** Use new API endpoints and types
2. **Test Workflows:** Anonymous purchases, seller applications, event approvals
3. **Configure Stripe:** Set up Connect accounts and webhooks
4. **Deploy Frontend:** Push updated code to production

The step-by-step approach ensures we don't get column reference errors and maintains data integrity throughout the migration process!
