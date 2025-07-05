import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Test image URLs directly
    const imageUrls = [
      'https://vzndqhzpzdphiiblwplh.supabase.co/storage/v1/object/public/pub/logo.png',
      'https://vzndqhzpzdphiiblwplh.supabase.co/storage/v1/object/public/pub/',
      'https://vzndqhzpzdphiiblwplh.supabase.co/storage/v1/object/public/'
    ];

    const testResults = [];

    for (const url of imageUrls) {
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        testResults.push({
          url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          accessible: response.ok
        });
      } catch (fetchError) {
        testResults.push({
          url,
          status: 'ERROR',
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          accessible: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Image URL test completed',
      data: {
        testResults,
        nextConfig: {
          imageRemotePatterns: [
            {
              protocol: 'https',
              hostname: 'vzndqhzpzdphiiblwplh.supabase.co',
              port: '',
              pathname: '/storage/v1/object/public/**',
            }
          ]
        },
        troubleshooting: {
          'If all tests fail': 'Supabase storage may be misconfigured or project URL is wrong',
          'If logo.png fails but bucket succeeds': 'The logo.png file does not exist',
          'If 403 errors': 'Bucket policy may not allow public access',
          'If CORS errors': 'Need to configure CORS in Supabase storage'
        }
      }
    });

  } catch (error) {
    console.error('Image test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
