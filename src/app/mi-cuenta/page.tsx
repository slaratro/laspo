'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Egg,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  PlusCircle,
  Loader2,
  MapPin,
  Phone,
  FileText,
  Zap
} from 'lucide-react';

interface Pedido {
  id_pedido: string;
  cantidad_planchas: number;
  tipo_frecuencia: string;
  fechas_personalizadas: string[];
  estado_entrega: string;
  direccion_entrega: string;
  telefono: string;
  notas: string;
  created_at: string;
}

export default function MiCuentaPage() {
  const [user, setUser] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario
  const [cantidad, setCantidad] = useState<number | string>(1);
  const [frecuencia, setFrecuencia] = useState<'semanal' | 'quincenal' | 'espontaneo' | 'personalizado'>('semanal');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [fechaUnica, setFechaUnica] = useState<string>('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setUser(user);

    // Cargar perfil
    const { data: perfilData } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (perfilData) {
      setPerfil(perfilData);
      setDireccion(perfilData.direccion || '');
      setTelefono(perfilData.telefono || '');
    }

    // Cargar pedidos del usuario
    const { data: pedidosData } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id_cliente', user.id)
      .order('created_at', { ascending: false });

    if (pedidosData) {
      setPedidos(pedidosData as Pedido[]);
    }

    setLoading(false);
  };

  const handleCrearPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMensaje(null);

    const cantidadFinal = Math.max(1, Number(cantidad) || 1);

    try {
      if (frecuencia === 'personalizado') {
        if (selectedDates.length === 0) {
          throw new Error('Por favor selecciona al menos una fecha en el calendario.');
        }
        
        // Crear 1 entrega individual por cada fecha seleccionada (1 a muchos)
        const registros = selectedDates.map((d) => ({
          id_cliente: user.id,
          cantidad_planchas: cantidadFinal,
          tipo_frecuencia: 'personalizado',
          fechas_personalizadas: [format(d, 'yyyy-MM-dd')],
          direccion_entrega: direccion,
          telefono,
          notas,
          estado_entrega: 'pendiente',
        }));

        const { error } = await supabase.from('pedidos').insert(registros);
        if (error) throw error;
      } else {
        let fechasISO: string[] = [];

        if (frecuencia === 'espontaneo') {
          fechasISO = fechaUnica ? [fechaUnica] : [format(new Date(), 'yyyy-MM-dd')];
        }

        const { error } = await supabase.from('pedidos').insert([
          {
            id_cliente: user.id,
            cantidad_planchas: cantidadFinal,
            tipo_frecuencia: frecuencia,
            fechas_personalizadas: fechasISO,
            direccion_entrega: direccion,
            telefono,
            notas,
            estado_entrega: 'pendiente',
          },
        ]);

        if (error) throw error;
      }

      setMensaje({
        tipo: 'exito',
        texto: frecuencia === 'espontaneo'
          ? '¡Tu pedido espontáneo por única vez ha sido registrado!'
          : '¡Tu pedido de huevos frescos se ha registrado con éxito!',
      });

      // Resetear formulario
      setCantidad(1);
      setFrecuencia('semanal');
      setSelectedDates([]);
      setFechaUnica('');
      setNotas('');

      // Recargar lista de pedidos
      cargarDatos();
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Error al guardar el pedido.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Mi Cuenta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            ¡Hola, {perfil?.nombre || user?.email}! 🐔
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gestiona tus suscripciones y pedidos espontáneos de huevos frescos.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          <LogOut className="w-4 h-4" /> Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario de Nuevo Pedido */}
        <div className="lg:col-span-7 p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 transition-colors duration-200">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <PlusCircle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Nuevo Pedido de Planchas</h2>
          </div>

          {mensaje && (
            <div
              className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
                mensaje.tipo === 'exito'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              }`}
            >
              {mensaje.tipo === 'exito' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0" />
              )}
              <span>{mensaje.texto}</span>
            </div>
          )}

          <form onSubmit={handleCrearPedido} className="space-y-6">
            {/* Cantidad de Planchas */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Cantidad de Planchas (30 huevos c/u)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={cantidad}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setCantidad('');
                    } else {
                      const parsed = parseInt(val, 10);
                      setCantidad(isNaN(parsed) ? '' : parsed);
                    }
                  }}
                  onBlur={() => {
                    if (cantidad === '' || Number(cantidad) < 1) {
                      setCantidad(1);
                    }
                  }}
                  className="w-28 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-center text-xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Total: <strong className="text-amber-600 dark:text-amber-400">{(Number(cantidad) || 0) * 30} huevos</strong>
                </span>
              </div>
            </div>

            {/* Selector de Frecuencia / Tipo de Pedido */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Tipo de Pedido / Frecuencia
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFrecuencia('semanal')}
                  className={`py-3 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                    frecuencia === 'semanal'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <Clock className="w-4 h-4" /> Cada 7 días
                </button>

                <button
                  type="button"
                  onClick={() => setFrecuencia('quincenal')}
                  className={`py-3 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                    frecuencia === 'quincenal'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" /> Cada 15 días
                </button>

                <button
                  type="button"
                  onClick={() => setFrecuencia('espontaneo')}
                  className={`py-3 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                    frecuencia === 'espontaneo'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-300" /> ⚡ Espontáneo
                </button>

                <button
                  type="button"
                  onClick={() => setFrecuencia('personalizado')}
                  className={`py-3 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                    frecuencia === 'personalizado'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  🗓️ Personalizado
                </button>
              </div>
            </div>

            {/* Fecha para Pedido Espontáneo */}
            {frecuencia === 'espontaneo' && (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-600" /> Fecha Deseada para Entrega Puntual:
                </label>
                <input
                  type="date"
                  value={fechaUnica}
                  onChange={(e) => setFechaUnica(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  * Este es un pedido por única vez y no creará suscripciones automáticas en el futuro.
                </p>
              </div>
            )}

            {/* Calendario Interactivo si es Personalizado */}
            {frecuencia === 'personalizado' && (
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Selecciona una o varias fechas exactas en el calendario:
                </label>
                <div className="flex justify-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                  <DayPicker
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => setSelectedDates(dates || [])}
                    locale={es}
                    className="p-2"
                  />
                </div>
                {selectedDates.length > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                    Fechas seleccionadas: {selectedDates.map((d) => format(d, 'dd/MM/yyyy')).join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Teléfono y Dirección */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-600" /> Teléfono
                </label>
                <input
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
                  placeholder="Teléfono de contacto"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" /> Dirección de Entrega
                </label>
                <input
                  type="text"
                  required
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
                  placeholder="Dirección donde entregar"
                />
              </div>
            </div>

            {/* Notas opcionales */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-600" /> Notas o Aclaraciones (Opcional)
              </label>
              <textarea
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
                placeholder="Ej. Timbre roto, dejar en la portería..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Egg className="w-5 h-5" /> {frecuencia === 'espontaneo' ? 'Confirmar Pedido Espontáneo' : 'Confirmar Pedido de Huevos'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Historial de Pedidos Propios */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Clock className="w-5 h-5 text-amber-600" /> Mis Pedidos Realizados
          </h2>

          {pedidos.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 transition-colors duration-200">
              Aún no has realizado ningún pedido. ¡Realiza el primero ahora! 🥚
            </div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {pedidos.map((p) => (
                <div
                  key={p.id_pedido}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm space-y-2 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-lg text-amber-600 dark:text-amber-500 flex items-center gap-1">
                      <Egg className="w-4 h-4" /> {p.cantidad_planchas} planchas
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        p.estado_entrega === 'entregado'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : p.estado_entrega === 'cancelado'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-300 dark:border-red-800'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {p.estado_entrega}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tipo de pedido:{' '}
                    <strong className="text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1 inline-flex">
                      {p.tipo_frecuencia === 'espontaneo' && <Zap className="w-3 h-3 text-amber-500" />}
                      {p.tipo_frecuencia}
                    </strong>
                  </p>

                  {p.fechas_personalizadas && p.fechas_personalizadas.length > 0 && (
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Fechas:{' '}
                      <span className="font-mono text-amber-600 dark:text-amber-400">
                        {p.fechas_personalizadas.join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    <span>{p.direccion_entrega}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
