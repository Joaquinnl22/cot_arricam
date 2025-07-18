// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('auth_token')?.value;

  console.log('🚀 Middleware ejecutado en ruta:', pathname);
  console.log('🔐 Token recibido:', token);

  if (pathname === '/' || pathname.startsWith('/api/login')) {
    return NextResponse.next(); // permite acceso a página de login
  }

  if (token === '123456') {
    return NextResponse.next(); // acceso autorizado
  }

  return NextResponse.redirect(new URL('/', request.url)); // redirige al login
}

export const config = {
  matcher: [
    '/((?!_next|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|webp|js|css|ico|json|txt|map)).*)',
    '/api/:path*',
  ],
};
