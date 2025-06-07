import { NextResponse } from 'next/server';

export async function middleware(request: Request) {
  try {
    // ...existing middleware logic...
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Optionally, update your config if needed:
// export const config = { matcher: ["/"] }
