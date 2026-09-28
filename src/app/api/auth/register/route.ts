import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, nombre, telefono, direccion } = await request.json();
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
      },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'Error al crear usuario' }, { status: 400 });
    }

    const isJoaquin = nombre?.toLowerCase().includes('joaquin laratro') || email?.toLowerCase().includes('joaquin');
    await supabase
      .from('perfiles')
      .update({
        telefono,
        direccion,
        nombre,
        ...(isJoaquin ? { rol: 'admin' } : {}),
      })
      .eq('id', data.user.id);

    return NextResponse.json({ success: true, user: data.user, rol: isJoaquin ? 'admin' : 'cliente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error en el servidor' }, { status: 500 });
  }
}
