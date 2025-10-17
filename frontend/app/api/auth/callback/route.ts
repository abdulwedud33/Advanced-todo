import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  if (!token) {
    return NextResponse.redirect(new URL('/signin?error=invalid_token', frontendUrl));
  }

  // Create a response that will redirect to the home page
  const response = NextResponse.redirect(new URL('/', frontendUrl));
  
  // Set the token in a secure, httpOnly cookie
  response.cookies.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return response;
}
