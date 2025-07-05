import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== PROFILE PICTURE UPLOAD ===');
    
    // Get the current user using server-side authentication
    const supabaseClient = createClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.log('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Get the uploaded file from form data
    const formData = await request.formData();
    const file = formData.get('profilePicture') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    console.log('✅ File validation passed:', file.name, file.type, `${Math.round(file.size / 1024)}KB`);

    // Generate filename with user ID
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/avatar.${fileExtension}`;

    console.log('📁 Uploading to:', fileName);

    // Convert file to array buffer
    const fileBuffer = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('user-profile-pictures')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true, // Replace existing file
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ File uploaded:', uploadData.path);

    // Get the public URL
    const { data: urlData } = supabaseClient.storage
      .from('user-profile-pictures')
      .getPublicUrl(fileName);

    const profilePictureUrl = urlData.publicUrl;
    console.log('🔗 Public URL:', profilePictureUrl);

    // Update user record with profile picture URL
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({ 
        profile_picture_url: profilePictureUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      return NextResponse.json(
        { 
          warning: 'File uploaded but failed to update user record',
          profilePictureUrl,
          error: updateError.message
        },
        { status: 200 }
      );
    }

    console.log('✅ User record updated with profile picture URL');

    return NextResponse.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePictureUrl,
      fileName: uploadData.path
    });

  } catch (error: any) {
    console.error('❌ Profile picture upload error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}
