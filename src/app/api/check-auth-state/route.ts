import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json({ error: 'Session error', details: sessionError.message })
    }

    if (!session) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'No active session' 
      })
    }

    const user = session.user
    
    // Check if this is an anonymous user
    const isAnonymous = user.is_anonymous || false
    
    return NextResponse.json({
      authenticated: true,
      user_id: user.id,
      email: user.email,
      is_anonymous: isAnonymous,
      providers: user.app_metadata?.providers || [],
      session_expires_at: session.expires_at,
      auth_context: 'This endpoint cannot access RLS-protected data without proper auth context'
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
