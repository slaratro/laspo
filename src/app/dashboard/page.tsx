'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import LasPoCalendar from '@/components/LasPoCalendar';
import AdminMetrics from '@/components/AdminMetrics';
import NuevoPedidoAdminModal from '@/components/NuevoPedidoAdminModal';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Egg,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  UserCheck,
  Filter,
  BarChart3,
  CalendarDays,
  Zap,
  X
} from 'lucide-react';

interface PedidoAdmin {
  id_pedido: string;
  id_cliente: string;
  cantidad_planchas: number;
  tipo_frecuencia: string;
  fechas_personalizadas: string[];
  fechas_entregadas?: string[];
  estado_entrega: string;
  direccion_entrega: string;
  telefono: string;
  notas: string;
  created_at: string;
  perfiles: {
    nombre: string;
    telefono: string;
    direccion: string;
  };
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'entregas' | 'metricas'>('entregas');
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string>('todos');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    cargarTodosLosPedidos();
  }, []);

  const cargarTodosLosPedidos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          perfiles (
            nombre,
            telefono,
            direccion
          )
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setPedidos(data as any);
      }
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoEntregaDePedido = (p: PedidoAdmin, fechaTarget?: string | null) => {
    if (fechaTarget && Array.isArray(p.fechas_personalizadas) && p.fechas_personalizadas.length > 1) {
      if (Array.isArray(p.fechas_entregadas) && p.fechas_entregadas.includes(fechaTarget)) {
        return 'entregado';
      }
      if (p.estado_entrega === 'cancelado') return 'cancelado';
      return 'pendiente';
    }
    return p.estado_entrega;
  };

  const cambiarEstadoEntrega = async (id_pedido: string, nuevoEstado: string, fechaEspecifica?: string | null) => {
    setUpdatingId(id_pedido);
    try {
      const p = pedidos.find((item) => item.id_pedido === id_pedido);
      if (!p) return;

      let payload: any = {};
      const fechas = p.fechas_personalizadas || [];
      const entregadasActuales = p.fechas_entregadas || [];

      if (fechaEspecifica && fechas.length > 1) {
        let nuevasEntregadas = [...entregadasActuales];
        if (nuevoEstado === 'entregado') {
          if (!nuevasEntregadas.includes(fechaEspecifica)) {
            nuevasEntregadas.push(fechaEspecifica);
          }
        } else {
          nuevasEntregadas = nuevasEntregadas.filter((f) => f !== fechaEspecifica);
        }
        payload.fechas_entregadas = nuevasEntregadas;

        if (fechas.length > 0 && fechas.every((f) => nuevasEntregadas.includes(f))) {
          payload.estado_entrega = 'entregado';
        } else {
          payload.estado_entrega = 'pendiente';
        }
      } else {
        payload.estado_entrega = nuevoEstado;
        if (nuevoEstado === 'entregado') {
          payload.fechas_entregadas = fechas;
        } else if (nuevoEstado === 'pendiente') {
          payload.fechas_entregadas = [];
        }
      }

      const { error } = await supabase
        .from('pedidos')
        .update(payload)
        .eq('id_pedido', id_pedido);

      if (error) throw error;

      await cargarTodosLosPedidos();
    } catch (err: any) {
      alert('Error al actualizar el estado: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    const estadoActual = getEstadoEntregaDePedido(p, selectedDateFilter);

    // 1. Filtro por estado de entrega
    if (filterState !== 'todos' && estadoActual !== filterState) {
      return false;
    }

    // 2. Filtro por fecha del calendario
    if (selectedDateFilter) {
      if (Array.isArray(p.fechas_personalizadas) && p.fechas_personalizadas.length > 0) {
        return p.fechas_personalizadas.includes(selectedDateFilter);
      }
      if (p.created_at) {
        return p.created_at.startsWith(selectedDateFilter);
      }
      return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <span className="text-sm font-semibold text-slate-500">Cargando panel de administración de Laspo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Admin */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-amber-400" />
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Dashboard General de Laspo (Admin)
            </h1>
            <p className="text-xs text-slate-400">
              Control de entregas, métricas y directorio de clientes
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Botón para crear pedido espontáneo */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Zap className="w-4 h-4 fill-current" /> + Pedido Espontáneo
          </button>

          {/* Navegación por pestañas */}
          <div className="flex items-center gap-1 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => setActiveTab('entregas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'entregas'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <CalendarDays className="w-4 h-4" /> Entregas
            </button>
            <button
              onClick={() => setActiveTab('metricas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'metricas'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Métricas & Clientes
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pestaña 1: Entregas y Calendario */}
      {activeTab === 'entregas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Calendario General Nativo LasPoCalendar */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 transition-colors">
            <LasPoCalendar
              pedidos={pedidos}
              onSelectDate={(dateStr) => setSelectedDateFilter(dateStr)}
            />
          </div>

          {/* Checklist de Entregas Interactiva */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Egg className="w-5 h-5 text-amber-600" /> Checklist de Entregas
                </h2>
                {selectedDateFilter && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                      <Filter className="w-3 h-3" /> Día seleccionado: {selectedDateFilter}
                    </span>
                    <button
                      onClick={() => setSelectedDateFilter(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold flex items-center gap-0.5 underline cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Ver todos
                    </button>
                  </div>
                )}
              </div>

              {/* Filtros */}
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 transition-colors"
              >
                <option value="todos">Todos ({pedidos.length})</option>
                <option value="pendiente">Pendientes</option>
                <option value="entregado">Entregados</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>

            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {pedidosFiltrados.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
                  No hay pedidos registrados en este filtro.
                </div>
              ) : (
                pedidosFiltrados.map((p) => {
                  const estadoActual = getEstadoEntregaDePedido(p, selectedDateFilter);

                  return (
                    <div
                      key={p.id_pedido}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm space-y-3 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-1.5">
                            {p.perfiles?.nombre || 'Cliente sin nombre'}
                            {p.tipo_frecuencia === 'espontaneo' && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold flex items-center gap-0.5">
                                <Zap className="w-3 h-3" /> Espontáneo
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-amber-600 dark:text-amber-500 font-bold flex items-center gap-1 mt-0.5">
                            <Egg className="w-3.5 h-3.5" /> {p.cantidad_planchas} planchas ({p.tipo_frecuencia})
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            estadoActual === 'entregado'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : estadoActual === 'cancelado'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {estadoActual}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.direccion_entrega || p.perfiles?.direccion || 'Sin dirección registrada'}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.telefono || p.perfiles?.telefono || 'Sin teléfono'}</span>
                        </p>
                        {p.fechas_personalizadas && Array.isArray(p.fechas_personalizadas) && p.fechas_personalizadas.length > 0 && (
                          <p className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                            Fechas: {p.fechas_personalizadas.join(', ')}
                          </p>
                        )}
                        {p.notas && (
                          <p className="italic text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mt-1">
                            "{p.notas}"
                          </p>
                        )}
                      </div>

                      {/* Acciones de Mutación en Supabase */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        {updatingId === p.id_pedido ? (
                          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                        ) : (
                          <>
                            {estadoActual !== 'entregado' && (
                              <button
                                onClick={() => cambiarEstadoEntrega(p.id_pedido, 'entregado', selectedDateFilter)}
                                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Marcar Entregado{selectedDateFilter ? ' Este Día' : ''}
                              </button>
                            )}
                            {estadoActual !== 'cancelado' && (
                              <button
                                onClick={() => cambiarEstadoEntrega(p.id_pedido, 'cancelado', selectedDateFilter)}
                                className="py-2 px-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/50 dark:hover:bg-red-900/50 dark:text-red-300 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" /> Cancelar
                              </button>
                            )}
                            {estadoActual !== 'pendiente' && (
                              <button
                                onClick={() => cambiarEstadoEntrega(p.id_pedido, 'pendiente', selectedDateFilter)}
                                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Clock className="w-4 h-4" /> Pendiente
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pestaña 2: Métricas y Directorio de Clientes */}
      {activeTab === 'metricas' && (
        <AdminMetrics pedidos={pedidos} />
      )}

      {/* Modal para crear pedido espontáneo desde Admin */}
      <NuevoPedidoAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPedidoCreado={() => cargarTodosLosPedidos()}
      />
    </div>
  );
}
