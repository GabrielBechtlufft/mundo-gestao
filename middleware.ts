import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  const rotasProtegidas = [
    '/home', '/vendedor', '/propostas', '/aprovacao',
    '/configuracoes', '/pagamentos', '/vendedores', '/comprador',
  ];
  const precisaLogin = rotasProtegidas.some((r) => pathname.startsWith(r));

  if (!token && precisaLogin) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    const role = token.role as string;
    const trocarSenha = token.trocarSenha as boolean;

    // Força troca de senha antes de qualquer outra coisa
    if (trocarSenha && pathname !== '/trocar-senha') {
      return NextResponse.redirect(new URL('/trocar-senha', request.url));
    }

    // Allow logged-in users to see the landing page
    if (pathname === '/') {
      return NextResponse.next();
    }

    // Não aplica restrições de role enquanto estiver na página de troca de senha
    if (pathname === '/trocar-senha') {
      return NextResponse.next();
    }

    // Vendedor can only access /vendedor/*
    if (role === 'VENDEDOR' && !pathname.startsWith('/vendedor/')) {
      return NextResponse.redirect(new URL('/vendedor/home', request.url));
    }

    // Comprador restricted from admin and vendor routes
    const rotasAdmin = ['/propostas', '/aprovacao', '/vendedores', '/pagamentos', '/configuracoes', '/home'];
    if (role === 'COMPRADOR' && rotasAdmin.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/comprador/home', request.url));
    }
    if (role === 'COMPRADOR' && pathname.startsWith('/vendedor')) {
      return NextResponse.redirect(new URL('/comprador/home', request.url));
    }

    // Admin restricted from vendor and buyer panels
    if (role === 'ADMIN' && pathname.startsWith('/vendedor/')) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    if (role === 'ADMIN' && pathname.startsWith('/comprador')) {
      return NextResponse.redirect(new URL('/home', request.url));
    }

    // Already logged in trying to access /login
    if (pathname === '/login') {
      if (role === 'VENDEDOR') return NextResponse.redirect(new URL('/vendedor/home', request.url));
      if (role === 'COMPRADOR') return NextResponse.redirect(new URL('/comprador/home', request.url));
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/home/:path*',
    '/comprador/:path*',
    '/vendedor/:path*',
    '/propostas/:path*',
    '/pagamentos/:path*',
    '/configuracoes/:path*',
    '/aprovacao/:path*',
    '/vendedores/:path*',
    '/trocar-senha',
    '/login',
    '/',
  ],
};
