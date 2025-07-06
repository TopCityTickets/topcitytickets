import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with service role
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    console.log('🔧 Force fixing seller data with SQL...');

    // Force update ALL users with seller_status = 'pending' with proper data
    const { data: result, error: sqlError } = await supabase
      .rpc('exec_sql', {
        sql: `
          UPDATE users 
          SET 
            seller_business_name = COALESCE(seller_business_name, 'Legacy Business'),
            seller_business_type = COALESCE(seller_business_type, 'other'),
            seller_description = COALESCE(seller_description, 'Legacy seller application'),
            seller_contact_email = COALESCE(seller_contact_email, email),
            seller_contact_phone = COALESCE(seller_contact_phone, ''),
            website_url = COALESCE(website_url, ''),
            seller_applied_at = COALESCE(seller_applied_at, NOW()),
            first_name = COALESCE(first_name, 'Legacy'),
            last_name = COALESCE(last_name, 'User'),
            updated_at = NOW()
          WHERE seller_status = 'pending'
          RETURNING id, email, seller_business_name, seller_business_type;
        `
      });

    // If rpc doesn't work, try direct update
    if (sqlError) {
      console.log('🔧 RPC failed, trying direct update...');
      
      const { data: updatedUsers, error: updateError } = await supabase
        .from('users')
        .update({
          seller_business_name: 'Legacy Business',
          seller_business_type: 'other', 
          seller_description: 'Legacy seller application',
          seller_contact_email: 'legacy@example.com',
          seller_contact_phone: '',
          website_url: '',
          seller_applied_at: new Date().toISOString(),
          first_name: 'Legacy',
          last_name: 'User',
          updated_at: new Date().toISOString()
        })
        .eq('seller_status', 'pending')
        .is('seller_business_name', null)
        .select('id, email, seller_business_name');

      if (updateError) {
        console.error('🔧 Direct update failed:', updateError);
        
        // Last resort - update ALL pending users regardless of current values
        const { data: forceUpdate, error: forceError } = await supabase
          .from('users')
          .update({
            seller_business_name: 'Legacy Business',
            seller_business_type: 'other',
            seller_description: 'Legacy seller application', 
            seller_contact_email: 'legacy@example.com',
            seller_applied_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('seller_status', 'pending')
          .select('id, email, seller_business_name');

        if (forceError) {
          throw new Error(`Force update failed: ${forceError.message}`);
        }

        return NextResponse.json({
          success: true,
          message: `Force updated ${forceUpdate?.length || 0} pending users`,
          data: forceUpdate
        });
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${updatedUsers?.length || 0} pending users`,
        data: updatedUsers
      });
    }

    return NextResponse.json({
      success: true,
      message: 'SQL force update completed',
      data: result
    });

  } catch (error: any) {
    console.error('🔧 SQL fix error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
