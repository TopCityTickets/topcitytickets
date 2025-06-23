# Dashboard Navigation Testing Guide

## Testing Steps:

1. **Login as Admin User:**
   - Go to https://topcitytickets-5yw5caabw-ray-starnes-projects.vercel.app
   - Click "Sign In" 
   - Use email: `topcitytickets@gmail.com` and password
   - After login, check the debug panel in the bottom right corner

2. **Check Debug Panel:**
   - The debug panel shows current role, authentication status, and database info
   - Click the refresh button to fetch latest database information
   - Verify that both "Hook Role" and "DB Role" show "admin"
   - Verify that "Admin" shows "Yes"

3. **Check Navigation:**
   - Look at the top navigation bar
   - You should see "Admin Dashboard" button if you're logged in as admin
   - Other users should see "Dashboard" or "Seller Dashboard" based on their role

4. **Admin Dashboard Access:**
   - Click on "Admin Dashboard" in the navbar
   - You should be able to access `/admin/dashboard`
   - The page should show admin-specific content like user management, seller applications, etc.

## Troubleshooting:

If the admin dashboard link doesn't appear:

1. **Check Role in Database:**
   - The debug API endpoint can be used: `/api/debug-admin?action=check`
   - Or use: `/api/debug-admin?action=set-admin` to ensure admin role is set

2. **Clear Browser Cache:**
   - Sometimes authentication state gets cached
   - Try logging out and logging back in
   - Or open in incognito/private mode

3. **Check Debug Panel:**
   - The debug panel shows exactly what the app thinks about your authentication
   - If "Admin" shows "No" but you should be admin, there's a role detection issue

## Current Fix:

The navbar has been updated to use the improved `useAuth` hook which provides more reliable role detection. The debug component helps identify any authentication or role issues.

## Clean Up:

After testing is complete, remember to:
1. Remove the `AuthDebug` component from `layout.tsx`
2. Delete the `/api/debug-admin` endpoint
3. Remove the debug files

These are development tools and should not be included in production.
