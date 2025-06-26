import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailTemplates } from '@/lib/email';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { type, userId, reason, eventName, eventUrl } = await request.json();

    // Verify the request is from an authenticated admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details
    const { data: user, error: userError } = await supabase()
      .from('users')
      .select('email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userName = user.first_name 
      ? `${user.first_name} ${user.last_name || ''}`.trim()
      : 'there';

    let emailTemplate;
    switch (type) {
      case 'seller_approved':
        emailTemplate = emailTemplates.sellerApproved(userName, user.email);
        break;
      case 'seller_rejected':
        emailTemplate = emailTemplates.sellerRejected(userName, user.email, reason);
        break;
      case 'event_approved':
        if (!eventName || !eventUrl) {
          return NextResponse.json({ error: 'Event name and URL required for event approval' }, { status: 400 });
        }
        emailTemplate = emailTemplates.eventApproved(eventName, user.email, eventUrl);
        break;
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const result = await sendEmail(emailTemplate);

    if (result.success) {
      return NextResponse.json({ 
        message: 'Email sent successfully',
        data: result.data 
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to send email',
        details: result.error 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Email notification error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
