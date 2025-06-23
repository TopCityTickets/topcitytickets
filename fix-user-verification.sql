-- Manual fix for confirmed users missing from public.users table
-- This script should be run when there are users stuck in verification loops

-- First, let's recreate the trigger to make sure it works
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Function to handle new user creation (with better error handling)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create if the user doesn't already exist in public.users
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        INSERT INTO public.users (id, email, role, created_at)
        VALUES (NEW.id, NEW.email, 'user', NEW.created_at);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new signups
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle email confirmation (this is what we might be missing)
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
    -- Create public.users record when email is confirmed (if it doesn't exist)
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        INSERT INTO public.users (id, email, role, created_at)
        VALUES (NEW.id, NEW.email, 'user', NEW.created_at)
        ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email confirmation
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_confirmed();

-- Now let's manually fix any existing confirmed users that are missing from public.users
-- Note: This is a placeholder since we can't directly query auth.users from SQL
-- In practice, you'd need to get the user IDs from the frontend or API and run:

-- Example for a specific user (replace with actual user ID and email):
-- INSERT INTO public.users (id, email, role, created_at)
-- VALUES ('user-id-here', 'user-email-here', 'user', NOW())
-- ON CONFLICT (id) DO NOTHING;
