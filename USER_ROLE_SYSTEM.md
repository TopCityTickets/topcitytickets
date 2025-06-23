# TopCityTickets User Role & Dashboard System

## 🔄 User Role Flow

### 1. **New User Registration**
- User signs up → Gets `user` role by default
- Can browse events, access basic dashboard
- **Cannot submit events** (seller access required)

### 2. **Applying for Seller Status**
- User goes to `/dashboard`
- Sees "Become a Seller" card
- Clicks "Apply for Seller Status"
- Application submitted to `seller_applications` table
- Status shows "Application pending review"

### 3. **Admin Approval Process**
- Admin goes to `/admin/dashboard`
- Views "Seller Applications" tab
- Can **Approve** or **Reject** applications
- When approved → User role automatically updates to `seller`

### 4. **Seller Access**
- Seller can access `/submit-event` page
- Can create and manage events
- Seller dashboard shows event management tools

## 🎛️ Dashboard Access by Role

### **User Dashboard** (`/dashboard`)
- ✅ View profile
- ✅ Browse events  
- ✅ Apply for seller status
- ❌ Submit events (redirected with helpful message)

### **Seller Dashboard** (`/dashboard`)
- ✅ All user features
- ✅ Submit events button
- ✅ Event management tools
- ✅ Role badge shows "Seller"

### **Admin Dashboard** (`/admin/dashboard`)
- ✅ Manage seller applications
- ✅ View system statistics
- ✅ Review event submissions
- ✅ Full administrative control

## 🛡️ Route Protection

### **Submit Event** (`/submit-event`)
- **Requires:** `seller` or `admin` role
- **Redirects:** Users to dashboard with application instructions
- **Shows:** Clear role requirements and next steps

### **Admin Panel** (`/admin/dashboard`)
- **Requires:** `admin` role
- **Redirects:** Non-admins to home page
- **Shows:** Access denied message

## 📊 Admin Features

### **Seller Application Management**
- View all applications (pending, approved, rejected)
- One-click approve/reject buttons
- Automatic role updates when approved
- Application history and timestamps

### **System Statistics**
- Total users count
- Active sellers count  
- Pending applications count
- Total events count

### **Event Management**
- Review pending event submissions
- Approve/reject events
- Full event oversight

## 🗄️ Database Tables

### **users**
```sql
- id (UUID, primary key)
- email (text)
- role (text: 'user', 'seller', 'admin')
- created_at, updated_at
```

### **seller_applications** 
```sql
- id (UUID, primary key)
- user_id (UUID, references users)
- status ('pending', 'approved', 'rejected')
- applied_at, reviewed_at
- reviewed_by (UUID, references users)
- notes (text, optional)
```

## 🚀 Setup Instructions

### **Run Database Migration**
```sql
-- Run this in Supabase SQL Editor
\i supabase/migrations/002_seller_applications.sql
```

### **Make Yourself Admin**
```sql
-- Replace with your email
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## ✨ Key Features

- **Role-based access control** with clear messaging
- **Application workflow** for seller status
- **Ultra-dark theme** with smooth animations
- **Real-time role updates** without page refresh
- **Comprehensive admin panel** for management
- **Clear user guidance** for role progression

The system now provides a complete user journey from registration to seller status, with proper admin oversight and beautiful UX! 🎉
