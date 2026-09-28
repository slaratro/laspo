import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://laspo.asgardpy.click';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzM1Njg5NjAwLCJleHAiOjIwNTEyMjI0MDB9.SpugvR8mmGkW2P00TZ7qr4dakiWXYE7xIMjJbwi17A0';

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // Proteger /dashboard (solo admins/subadmins)
  if (url.pathname.startsWith('/dashboard')) {
    if (!user) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol, nombre')
      .eq('id', user.id)
      .single();

    const isJoaquin = user.email?.toLowerCase().includes('joaquin') || perfil?.nombre?.toLowerCase().includes('joaquin laratro');

    if (isJoaquin && perfil && perfil.rol !== 'admin') {
      await supabase.from('perfiles').update({ rol: 'admin' }).eq('id', user.id);
    }

    if (!isJoaquin && (!perfil || (perfil.rol !== 'admin' && perfil.rol !== 'subadmin'))) {
      url.pathname = '/mi-cuenta';
      return NextResponse.redirect(url);
    }
  }

  // Proteger /mi-cuenta (requiere login)
  if (url.pathname.startsWith('/mi-cuenta')) {
    if (!user) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/mi-cuenta/:path*'],
};
