import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      modoCliente, // 'existente' | 'nuevo'
      idClienteExistente,
      nuevoCliente, // { nombre, email, telefono, direccion }
      cantidadPlanchas,
      fechaEntrega,
      notas,
    } = body;

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

    // 1. Verificar que el usuario que realiza la solicitud sea Admin o Subadmin
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: perfilAdmin } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!perfilAdmin || (perfilAdmin.rol !== 'admin' && perfilAdmin.rol !== 'subadmin')) {
      return NextResponse.json({ error: 'Permisos insuficientes de administrador' }, { status: 403 });
    }

    let targetClienteId = idClienteExistente;
    let targetTelefono = '';
    let targetDireccion = '';

    // 2. Si el modo es 'nuevo', registrar primero el cliente
    if (modoCliente === 'nuevo') {
      const { nombre, email, telefono, direccion } = nuevoCliente || {};

      if (!email || !nombre) {
        return NextResponse.json({ error: 'El nombre y el correo electrónico del nuevo cliente son obligatorios' }, { status: 400 });
      }

      // Crear usuario en GoTrue / Supabase Auth con contraseña aleatoria temporal
      const tempPassword = `Laspo${Math.random().toString(36).slice(-8)}!2026`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: { nombre },
        },
      });

      if (authError || !authData.user) {
        return NextResponse.json({ error: authError?.message || 'Error al registrar el nuevo cliente' }, { status: 400 });
      }

      targetClienteId = authData.user.id;
      targetTelefono = telefono || '';
      targetDireccion = direccion || '';

      // Actualizar datos de contacto en perfiles
      await supabase
        .from('perfiles')
        .update({
          nombre,
          telefono,
          direccion,
        })
        .eq('id', targetClienteId);
    } else {
      // Obtener teléfono y dirección del cliente existente
      const { data: perfilCliente } = await supabase
        .from('perfiles')
        .select('telefono, direccion')
        .eq('id', targetClienteId)
        .single();

      if (perfilCliente) {
        targetTelefono = perfilCliente.telefono || '';
        targetDireccion = perfilCliente.direccion || '';
      }
    }

    if (!targetClienteId) {
      return NextResponse.json({ error: 'Debes seleccionar o registrar un cliente válido' }, { status: 400 });
    }

    // 3. Insertar el Pedido Espontáneo en la tabla 'pedidos'
    const fechasISO = fechaEntrega ? [fechaEntrega] : [new Date().toISOString().split('T')[0]];

    const { data: nuevoPedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([
        {
          id_cliente: targetClienteId,
          cantidad_planchas: parseInt(cantidadPlanchas) || 1,
          tipo_frecuencia: 'espontaneo',
          fechas_personalizadas: fechasISO,
          direccion_entrega: targetDireccion,
          telefono: targetTelefono,
          notas: notas || 'Pedido Espontáneo creado desde Dashboard de Administración',
          estado_entrega: 'pendiente',
        },
      ])
      .select()
      .single();

    if (pedidoError) {
      return NextResponse.json({ error: pedidoError.message || 'Error al crear el pedido espontáneo' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      pedido: nuevoPedido,
      mensaje: 'Pedido espontáneo creado y asignado con éxito',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
