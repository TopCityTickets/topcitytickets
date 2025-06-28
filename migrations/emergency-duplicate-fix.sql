-- EMERGENCY FIX: Disable auto-user creation temporarily

-- Disable the trigger causing conflicts
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- Clean up duplicates manually
DELETE FROM public.users a USING (
    SELECT MIN(ctid) as ctid, id
    FROM public.users 
    GROUP BY id HAVING COUNT(*) > 1
) b
WHERE a.id = b.id AND a.ctid <> b.ctid;

-- Re-enable the trigger (if needed)
-- You can skip this if you want to handle user creation manually
CREATE OR REPLACE TRIGGER handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

SELECT 'Emergency fix completed' as status;
