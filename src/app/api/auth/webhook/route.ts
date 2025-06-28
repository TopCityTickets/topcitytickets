import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { record } = await request.json()
    
    if (!record?.id || !record?.email) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 })
    }

    // Create user in public.users table
    const { error } = await supabase
      .from('users')
      .insert({
        id: record.id,
        email: record.email,
        role: 'customer',
        created_at: record.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error && error.code !== '23505') { // Ignore unique constraint violations
      console.error('Error creating user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
