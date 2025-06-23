# Supabase Auth Configuration for Stable Domain

## Problem Fixed
✅ Updated Vercel environment variable `NEXT_PUBLIC_SITE_URL` to use stable domain: `https://topcitytickets.org`
✅ Deployed to production with correct configuration

## Next Steps - Supabase Auth Settings

Go to your Supabase Dashboard and update these settings:

### 1. Authentication → URL Configuration

**Site URL:** 
```
https://topcitytickets.org
```

**Redirect URLs (add both):**
```
https://topcitytickets.org/auth/callback
https://topcitytickets.vercel.app/auth/callback
```

### 2. Authentication → Settings

**Enable these settings:**
- ✅ Enable email confirmations
- ✅ Allow manual linking (this will fix the admin login issue)
- ❌ Disable sign-ups (optional, if you want invite-only)

### 3. Test the Fix

1. **Test signup flow:**
   - Go to: https://topcitytickets.org/signup
   - Sign up with a test email
   - Check that confirmation email links to correct domain

2. **Test admin login:**
   - Go to: https://topcitytickets.org/login  
   - Try logging in with topcitytickets@gmail.com
   - Should now work with manual linking enabled

### 4. Verify Admin Role

After successful login, check that:
- User sees "Admin Dashboard" link in navbar
- Can access: https://topcitytickets.org/admin/dashboard
- Role is correctly detected as "admin"

## Why This Fixes the Issue

1. **Stable URLs**: Email confirmation links now always point to topcitytickets.org
2. **Manual Linking**: Allows existing database users to authenticate through frontend
3. **Consistent Environment**: Production uses same domain as email redirects

## Backup Plan

If issues persist, you can always:
1. Delete the admin user: `DELETE FROM public.users WHERE email = 'topcitytickets@gmail.com';`
2. Have admin sign up fresh through: https://topcitytickets.org/signup
3. Update role manually: `UPDATE public.users SET role = 'admin' WHERE email = 'topcitytickets@gmail.com';`
