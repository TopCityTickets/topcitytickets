-- This creates helper stored procedures for debugging database issues
-- Usage: SELECT create_debug_procedures();

CREATE OR REPLACE FUNCTION create_debug_procedures() 
RETURNS TEXT AS $$
BEGIN
    -- Check if a table has RLS enabled
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_table_rls_status') THEN
        CREATE OR REPLACE FUNCTION get_table_rls_status(input_table_name TEXT)
        RETURNS JSONB AS $$
        DECLARE
            result JSONB;
        BEGIN
            SELECT 
                jsonb_build_object(
                    'table', t.tablename,
                    'rlsEnabled', t.rowsecurity
                ) INTO result
            FROM pg_tables t
            WHERE t.schemaname = 'public' AND t.tablename = input_table_name;
            
            RETURN result;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    END IF;

    -- Get policies for a table
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_table_policies') THEN
        CREATE OR REPLACE FUNCTION get_table_policies(input_table_name TEXT)
        RETURNS JSONB AS $$
        DECLARE
            result JSONB;
        BEGIN
            SELECT 
                jsonb_agg(
                    jsonb_build_object(
                        'policyname', p.policyname,
                        'permissive', p.permissive,
                        'roles', p.roles,
                        'cmd', p.cmd,
                        'qual', p.qual::text
                    )
                ) INTO result
            FROM pg_policies p
            WHERE p.tablename = input_table_name
            AND p.schemaname = 'public';
            
            RETURN result;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    END IF;

    -- Check if a trigger exists on a table
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_trigger_exists') THEN
        CREATE OR REPLACE FUNCTION check_trigger_exists(trigger_name TEXT, table_name TEXT)
        RETURNS JSONB AS $$
        DECLARE
            result JSONB;
        BEGIN
            SELECT 
                jsonb_build_object(
                    'exists', (EXISTS (
                        SELECT 1 
                        FROM pg_trigger
                        WHERE tgname = trigger_name
                        AND tgrelid = (table_name)::regclass
                    )),
                    'trigger_name', trigger_name
                ) INTO result;
            
            RETURN result;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    END IF;

    RETURN 'Debug procedures created successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
