'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  PackageCheck,
  Clock,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Egg,
  CalendarDays,
  Filter
} from 'lucide-react';

interface PedidoAdmin {
  id_pedido: string;
  id_cliente: string;
  cantidad_planchas: number;
  tipo_frecuencia: string;
  fechas_personalizadas: string[];
  estado_entrega: string;
  direccion_entrega: string;
  telefono: string;
  created_at: string;
  perfiles: {
    nombre: string;
    telefono: string;
    direccion: string;
  };
}

interface AdminMetricsProps {
  pedidos: PedidoAdmin[];
}

export default function AdminMetrics({ pedidos }: AdminMetricsProps) {
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes' | 'todos'>('mes');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Cálculos de KPIs principales
  const totalPlanchasEntregadas = useMemo(() => {
    return pedidos
      .filter((p) => p.estado_entrega === 'entregado')
      .reduce((acc, p) => acc + (p.cantidad_planchas || 0), 0);
  }, [pedidos]);

  const totalPlanchasPendientes = useMemo(() => {
    return pedidos
      .filter((p) => p.estado_entrega === 'pendiente')
      .reduce((acc, p) => acc + (p.cantidad_planchas || 0), 0);
  }, [pedidos]);

  const totalPlanchasCanceladas = useMemo(() => {
    return pedidos
      .filter((p) => p.estado_entrega === 'cancelado')
      .reduce((acc, p) => acc + (p.cantidad_planchas || 0), 0);
  }, [pedidos]);

  const totalClientesUnicos = useMemo(() => {
    const clientesSet = new Set(pedidos.map((p) => p.id_cliente).filter(Boolean));
    return clientesSet.size;
  }, [pedidos]);

  const promedioPlanchasPorPedido = useMemo(() => {
    if (pedidos.length === 0) return 0;
    const total = pedidos.reduce((acc, p) => acc + (p.cantidad_planchas || 0), 0);
    return Math.round((total / pedidos.length) * 10) / 10;
  }, [pedidos]);

  // 2. Agrupación para gráfico de entregas por fecha de entrega programada
  const chartData = useMemo(() => {
    const grupos: Record<string, { entregadas: number; pendientes: number; canceladas: number; total: number }> = {};

    pedidos.forEach((p) => {
      let fechaStr = (Array.isArray(p.fechas_personalizadas) && p.fechas_personalizadas.length > 0)
        ? p.fechas_personalizadas[0]
        : (p.created_at ? p.created_at.split('T')[0] : '');

      if (!fechaStr) return;

      const [yStr, mStr, dStr] = fechaStr.split('-');
      const fechaObj = new Date(parseInt(yStr), parseInt(mStr) - 1, parseInt(dStr) || 1);

      let key = 'Sin fecha';

      if (periodo === 'dia') {
        key = `${dStr}/${mStr}`;
      } else if (periodo === 'semana') {
        const startOfYear = new Date(fechaObj.getFullYear(), 0, 1);
        const pastDaysOfYear = (fechaObj.getTime() - startOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        key = `Sem ${weekNum}`;
      } else if (periodo === 'mes') {
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        key = `${monthNames[fechaObj.getMonth()]} ${fechaObj.getFullYear()}`;
      } else {
        key = 'Total Histórico';
      }

      if (!grupos[key]) {
        grupos[key] = { entregadas: 0, pendientes: 0, canceladas: 0, total: 0 };
      }

      const planchas = p.cantidad_planchas || 0;
      if (p.estado_entrega === 'entregado') {
        grupos[key].entregadas += planchas;
      } else if (p.estado_entrega === 'pendiente') {
        grupos[key].pendientes += planchas;
      } else if (p.estado_entrega === 'cancelado') {
        grupos[key].canceladas += planchas;
      }

      grupos[key].total += planchas;
    });

    return Object.entries(grupos).map(([label, val]) => ({
      label,
      ...val,
    }));
  }, [pedidos, periodo]);

  // Max valor para escalar barras del gráfico
  const maxValChart = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.total), 0);
    return max > 0 ? max : 10;
  }, [chartData]);

  // 3. Tabla de Clientes con métricas consolidadas
  const tablaClientes = useMemo(() => {
    const mapaClientes: Record<
      string,
      {
        nombre: string;
        telefono: string;
        direccion: string;
        totalPlanchas: number;
        frecuenciaHabitual: string;
        ultimoEstado: string;
        pedidosContador: number;
        ultimaFecha: string;
      }
    > = {};

    pedidos.forEach((p) => {
      const clienteId = p.id_cliente || p.perfiles?.nombre || 'Desconocido';
      const nombre = p.perfiles?.nombre || 'Cliente Registrado';
      const telefono = p.telefono || p.perfiles?.telefono || '-';
      const direccion = p.direccion_entrega || p.perfiles?.direccion || '-';

      if (!mapaClientes[clienteId]) {
        mapaClientes[clienteId] = {
          nombre,
          telefono,
          direccion,
          totalPlanchas: 0,
          frecuenciaHabitual: p.tipo_frecuencia || 'semanal',
          ultimoEstado: p.estado_entrega,
          pedidosContador: 0,
          ultimaFecha: p.created_at ? p.created_at.split('T')[0] : '-',
        };
      }

      mapaClientes[clienteId].totalPlanchas += p.cantidad_planchas || 0;
      mapaClientes[clienteId].pedidosContador += 1;
    });

    const lista = Object.values(mapaClientes);

    if (!searchQuery) return lista;

    const query = searchQuery.toLowerCase();
    return lista.filter(
      (c) =>
        c.nombre.toLowerCase().includes(query) ||
        c.direccion.toLowerCase().includes(query) ||
        c.telefono.toLowerCase().includes(query)
    );
  }, [pedidos, searchQuery]);

  return (
    <div className="space-y-8">
      {/* 1. Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4 transition-colors">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <PackageCheck className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Planchas Entregadas
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalPlanchasEntregadas} <span className="text-xs text-emerald-600 font-bold">({totalPlanchasEntregadas * 30} huevos)</span>
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4 transition-colors">
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Planchas Pendientes
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalPlanchasPendientes} <span className="text-xs text-amber-600 font-bold">({totalPlanchasPendientes * 30} huevos)</span>
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4 transition-colors">
          <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Clientes Activos
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalClientesUnicos} <span className="text-xs text-slate-500 font-bold">registrados</span>
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4 transition-colors">
          <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Promedio por Pedido
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {promedioPlanchasPorPedido} <span className="text-xs text-purple-600 font-bold">planchas</span>
            </h3>
          </div>
        </div>
      </div>

      {/* 2. Sección de Gráficos Interactivos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Gráfico 1: Evolución de Entregas por Período */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" /> Planchas Entregadas y Programadas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Volumen de planchas por intervalo de tiempo
              </p>
            </div>

            {/* Controles de Filtro (Día, Semana, Mes) */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setPeriodo('dia')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodo === 'dia'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Día
              </button>
              <button
                onClick={() => setPeriodo('semana')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodo === 'semana'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setPeriodo('mes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodo === 'mes'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Mes
              </button>
            </div>
          </div>

          {/* Renderizado de Barras Dinámicas */}
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              No hay datos registrados en este período.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-64 flex items-end justify-start gap-4 pt-8 pb-2 px-4 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                {chartData.map((item, idx) => {
                  const pctEntregadas = Math.round((item.entregadas / maxValChart) * 100);
                  const pctPendientes = Math.round((item.pendientes / maxValChart) * 100);
                  const pctCanceladas = Math.round((item.canceladas / maxValChart) * 100);

                  return (
                    <div
                      key={idx}
                      className="flex-1 min-w-[50px] max-w-[80px] flex flex-col items-center gap-1.5 group relative"
                    >
                      {/* Valor total en planchas arriba de la barra */}
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                        {item.total} p.
                      </span>

                      {/* Contenedor de Barras Apiladas */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex flex-col justify-end h-48 border border-slate-200 dark:border-slate-700 shadow-inner">
                        {item.canceladas > 0 && (
                          <div
                            style={{ height: `${Math.max(pctCanceladas, 15)}%` }}
                            className="w-full bg-red-600 hover:bg-red-500 transition-all flex items-center justify-center text-[10px] font-extrabold text-white"
                            title={`${item.canceladas} planchas canceladas`}
                          >
                            {item.canceladas}
                          </div>
                        )}
                        {item.pendientes > 0 && (
                          <div
                            style={{ height: `${Math.max(pctPendientes, 15)}%` }}
                            className="w-full bg-amber-500 hover:bg-amber-400 transition-all flex items-center justify-center text-[10px] font-extrabold text-slate-950"
                            title={`${item.pendientes} planchas pendientes`}
                          >
                            {item.pendientes}
                          </div>
                        )}
                        {item.entregadas > 0 && (
                          <div
                            style={{ height: `${Math.max(pctEntregadas, 15)}%` }}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center text-[10px] font-extrabold text-white"
                            title={`${item.entregadas} planchas entregadas`}
                          >
                            {item.entregadas}
                          </div>
                        )}
                      </div>

                      {/* Etiqueta del Eje X */}
                      <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 truncate max-w-[70px] text-center mt-1">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Leyenda de Colores */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 shadow-sm" /> Planchas Entregadas
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-amber-500 shadow-sm" /> Planchas Pendientes
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-red-600 shadow-sm" /> Planchas Canceladas
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Gráfico 2: Proporción Pendientes vs Entregadas */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 transition-colors">
          <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Egg className="w-5 h-5 text-amber-600" /> Estado de Entregas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Desglose porcentual de planchas
            </p>
          </div>

          <div className="space-y-5">
            {/* Barra Entregados */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-emerald-600 dark:text-emerald-400">Entregadas ({totalPlanchasEntregadas})</span>
                <span>
                  {pedidos.length > 0
                    ? Math.round((totalPlanchasEntregadas / (totalPlanchasEntregadas + totalPlanchasPendientes + totalPlanchasCanceladas || 1)) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${
                      pedidos.length > 0
                        ? (totalPlanchasEntregadas / (totalPlanchasEntregadas + totalPlanchasPendientes + totalPlanchasCanceladas || 1)) * 100
                        : 0
                    }%`,
                  }}
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Barra Pendientes */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-amber-600 dark:text-amber-400">Pendientes ({totalPlanchasPendientes})</span>
                <span>
                  {pedidos.length > 0
                    ? Math.round((totalPlanchasPendientes / (totalPlanchasEntregadas + totalPlanchasPendientes + totalPlanchasCanceladas || 1)) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${
                      pedidos.length > 0
                        ? (totalPlanchasPendientes / (totalPlanchasEntregadas + totalPlanchasPendientes + totalPlanchasCanceladas || 1)) * 100
                        : 0
                    }%`,
                  }}
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Barra Canceladas */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-red-600 dark:text-red-400">Canceladas ({totalPlanchasCanceladas})</span>
                <span>
                  {pedidos.length > 0
                    ? Math.round((totalPlanchasCanceladas / (totalPlanchasEntregadas + totalPlanchasPendientes + totalPlanchasCanceladas || 1)) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${
                      pedidos.length > 0
                        ? (totalPlanchasCanceladas / (totalPlanchasEntregadas + totalPlanchasPendientes + totalPlanchasCanceladas || 1)) * 100
                        : 0
                    }%`,
                  }}
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tabla de Clientes Completa */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-600" /> Directorio Completo de Clientes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Consolidado de planchas pedidas, direcciones y datos de contacto
            </p>
          </div>

          {/* Buscador de Clientes */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente, teléfono..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Tabla Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-bold text-[10px] tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 rounded-l-xl">Cliente</th>
                <th className="p-3.5">Teléfono</th>
                <th className="p-3.5">Dirección de Entrega</th>
                <th className="p-3.5 text-center">Frecuencia</th>
                <th className="p-3.5 text-center">Total Planchas</th>
                <th className="p-3.5 text-center rounded-r-xl">Estado Último Pedido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {tablaClientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                tablaClientes.map((c, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 font-extrabold text-slate-900 dark:text-slate-100">
                      {c.nombre}
                    </td>
                    <td className="p-3.5">{c.telefono}</td>
                    <td className="p-3.5">{c.direccion}</td>
                    <td className="p-3.5 text-center uppercase font-bold text-[10px] text-amber-600 dark:text-amber-400">
                      {c.frecuenciaHabitual}
                    </td>
                    <td className="p-3.5 text-center font-extrabold text-slate-900 dark:text-slate-100">
                      {c.totalPlanchas} planchas
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          c.ultimoEstado === 'entregado'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : c.ultimoEstado === 'cancelado'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {c.ultimoEstado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
