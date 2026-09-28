import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://laspo.asgardpy.click';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzM1Njg5NjAwLCJleHAiOjIwNTEyMjI0MDB9.SpugvR8mmGkW2P00TZ7qr4dakiWXYE7xIMjJbwi17A0';

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, httpOnly: false })
            );
          } catch {}
        },
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'Error de credenciales' }, { status: 400 });
    }

    const accessToken = data.session?.access_token;

    const supabaseRest = createServerClient(supabaseUrl, supabaseKey, {
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, httpOnly: false })
            );
          } catch {}
        },
      },
    });

    const { data: perfil } = await supabaseRest
      .from('perfiles')
      .select('rol, nombre')
      .eq('id', data.user.id)
      .single();

    let rol = perfil?.rol || 'cliente';
    const isJoaquin = data.user.email?.toLowerCase().includes('joaquin') || perfil?.nombre?.toLowerCase().includes('joaquin laratro');

    if (isJoaquin && rol !== 'admin') {
      await supabaseRest.from('perfiles').update({ rol: 'admin' }).eq('id', data.user.id);
      rol = 'admin';
    }

    return NextResponse.json({ success: true, rol, user: data.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error en el servidor de autenticación' }, { status: 500 });
  }
}
