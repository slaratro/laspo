-- ============================================================
-- SCHEMA DE BASE DE DATOS Y POLITICAS RLS - LASPO
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLA PERFILES
CREATE TABLE IF NOT EXISTS public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  rol TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin', 'subadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA PEDIDOS
CREATE TABLE IF NOT EXISTS public.pedidos (
  id_pedido UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_cliente UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  cantidad_planchas INTEGER NOT NULL CHECK (cantidad_planchas > 0),
  tipo_frecuencia TEXT NOT NULL CHECK (tipo_frecuencia IN ('semanal', 'quincenal', 'espontaneo', 'personalizado')),
  fechas_personalizadas TEXT[] DEFAULT '{}',
  fechas_entregadas TEXT[] DEFAULT '{}',
  estado_entrega TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_entrega IN ('pendiente', 'entregado', 'cancelado')),
  direccion_entrega TEXT,
  telefono TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AGREGAR COLUMNA SI NO EXISTE EN INSTANCIAS EXISTENTES
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS fechas_entregadas TEXT[] DEFAULT '{}';

-- HABILITAR RLS
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- FUNCIÓN AUXILIAR DE ROL DE ADMIN
CREATE OR REPLACE FUNCTION public.is_admin_or_subadmin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = user_id AND rol IN ('admin', 'subadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLÍTICAS PERFILES
DROP POLICY IF EXISTS "Los usuarios leen su propio perfil" ON public.perfiles;
CREATE POLICY "Los usuarios leen su propio perfil"
  ON public.perfiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin_or_subadmin(auth.uid()));

DROP POLICY IF EXISTS "Permitir crear perfil" ON public.perfiles;
CREATE POLICY "Permitir crear perfil"
  ON public.perfiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios y admins actualizan perfiles" ON public.perfiles;
CREATE POLICY "Usuarios y admins actualizan perfiles"
  ON public.perfiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin_or_subadmin(auth.uid()));

-- POLÍTICAS PEDIDOS
DROP POLICY IF EXISTS "Los usuarios ven sus propios pedidos" ON public.pedidos;
CREATE POLICY "Los usuarios ven sus propios pedidos"
  ON public.pedidos FOR SELECT
  USING (auth.uid() = id_cliente OR public.is_admin_or_subadmin(auth.uid()));

DROP POLICY IF EXISTS "Los usuarios insertan sus propios pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Los usuarios e administradores insertan pedidos" ON public.pedidos;
CREATE POLICY "Los usuarios e administradores insertan pedidos"
  ON public.pedidos FOR INSERT
  WITH CHECK (auth.uid() = id_cliente OR public.is_admin_or_subadmin(auth.uid()));

DROP POLICY IF EXISTS "Los administradores actualizan pedidos" ON public.pedidos;
CREATE POLICY "Los administradores actualizan pedidos"
  ON public.pedidos FOR UPDATE
  USING (public.is_admin_or_subadmin(auth.uid()));

-- TRIGGER PARA AUTO-CREACIÓN DE PERFILES Y ASIGNACIÓN DE ADMIN A JOAQUIN LARATRO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  assigned_rol TEXT;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email);
  IF user_name ILIKE '%Joaquin Laratro%' OR NEW.email ILIKE '%joaquin%' THEN
    assigned_rol := 'admin';
  ELSE
    assigned_rol := 'cliente';
  END IF;

  INSERT INTO public.perfiles (id, nombre, rol)
  VALUES (
    NEW.id,
    user_name,
    assigned_rol
  )
  ON CONFLICT (id) DO UPDATE SET rol = EXCLUDED.rol WHERE perfiles.nombre ILIKE '%Joaquin Laratro%';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ASIGNAR ROL DE ADMIN A JOAQUIN LARATRO SI YA SE REGISTRÓ
UPDATE public.perfiles
SET rol = 'admin'
WHERE nombre ILIKE '%Joaquin Laratro%' OR id IN (
  SELECT id FROM auth.users WHERE email ILIKE '%joaquin%' OR raw_user_meta_data->>'nombre' ILIKE '%Joaquin Laratro%'
);
