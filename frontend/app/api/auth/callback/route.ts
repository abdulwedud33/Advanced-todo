import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    console.log('OAuth callback received. Token present:', !!token);
    
    if (!token) {
      console.error('No token found in OAuth callback');
      return NextResponse.redirect(new URL('/signin?error=invalid_token', frontendUrl));
    }

    // Create a response that will redirect to the home page
    const response = NextResponse.redirect(new URL('/', frontendUrl));
    
    // Store the token in localStorage via client-side JavaScript
    const script = `
      <script>
        (function() {
          try {
            localStorage.setItem('token', '${token}');
            console.log('Token stored in localStorage');
          } catch (error) {
            console.error('Error storing token:', error);
          }
          window.location.href = '/';
        })();
      </script>
    `;
    
    // Return an HTML response that will execute the script
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting...</title>
          ${script}
        </head>
        <body>
          <p>Redirecting...</p>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return NextResponse.redirect(new URL('/signin?error=auth_error', frontendUrl));
  }
}
