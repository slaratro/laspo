'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Egg } from 'lucide-react';

interface PedidoCalendar {
  id_pedido: string;
  cantidad_planchas: number;
  tipo_frecuencia: string;
  fechas_personalizadas?: string[];
  fechas_entregadas?: string[];
  estado_entrega: string;
  created_at: string;
  perfiles?: {
    nombre: string;
  };
}

interface LasPoCalendarProps {
  pedidos: PedidoCalendar[];
  onSelectDate?: (dateStr: string | null) => void;
}

export default function LasPoCalendar({ pedidos, onSelectDate }: LasPoCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // Agosto 2026 por defecto
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isEntregadoParaFecha = (ord: PedidoCalendar, fechaStr: string) => {
    if (Array.isArray(ord.fechas_entregadas) && ord.fechas_entregadas.includes(fechaStr)) {
      return true;
    }
    if (ord.estado_entrega === 'entregado' && (!ord.fechas_personalizadas || ord.fechas_personalizadas.length <= 1)) {
      return true;
    }
    return false;
  };

  // Obtener primer día y total de días del mes
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Ajustar primer día para Lunes = 0, ..., Domingo = 6
  const startOffset = (firstDayOfMonth + 6) % 7;

  // Mapear pedidos por fecha YYYY-MM-DD según sus fechas programadas de entrega
  const ordersByDate: Record<string, PedidoCalendar[]> = {};

  pedidos.forEach((p) => {
    // Si tiene fechas programadas explícitas (espontáneo o personalizado)
    if (Array.isArray(p.fechas_personalizadas) && p.fechas_personalizadas.length > 0) {
      p.fechas_personalizadas.forEach((fecha) => {
        if (fecha) {
          if (!ordersByDate[fecha]) ordersByDate[fecha] = [];
          ordersByDate[fecha].push(p);
        }
      });
    } else if (p.created_at) {
      // Fallback a fecha de creación
      const fecha = p.created_at.split('T')[0];
      if (fecha) {
        if (!ordersByDate[fecha]) ordersByDate[fecha] = [];
        ordersByDate[fecha].push(p);
      }
    }
  });

  const handleDayClick = (dayNum: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    if (selectedDay === dateStr) {
      setSelectedDay(null);
      if (onSelectDate) onSelectDate(null);
    } else {
      setSelectedDay(dateStr);
      if (onSelectDate) onSelectDate(dateStr);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selector de Mes */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
            {monthNames[month]} {year}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Días de la Semana */}
      <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
        <span>Lun</span>
        <span>Mar</span>
        <span>Mié</span>
        <span>Jue</span>
        <span>Vie</span>
        <span>Sáb</span>
        <span>Dom</span>
      </div>

      {/* Rejilla del Calendario */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Espacios vacíos antes del día 1 */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="h-20 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 opacity-30" />
        ))}

        {/* Días del Mes */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const formattedMonth = String(month + 1).padStart(2, '0');
          const formattedDay = String(dayNum).padStart(2, '0');
          const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

          const dayOrders = ordersByDate[dateStr] || [];
          const isSelected = selectedDay === dateStr;

          return (
            <div
              key={`day-${dayNum}`}
              onClick={() => handleDayClick(dayNum)}
              className={`h-20 p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-500/50'
                  : dayOrders.length > 0
                  ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-400 shadow-sm'
                  : 'border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/20 hover:bg-slate-100/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-extrabold ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {dayNum}
                </span>
                {dayOrders.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>

              {/* Badges de Entregas */}
              <div className="space-y-1 overflow-hidden">
                {dayOrders.slice(0, 2).map((ord) => {
                  const entregadoHoy = isEntregadoParaFecha(ord, dateStr);
                  const canceladoHoy = ord.estado_entrega === 'cancelado';

                  return (
                    <div
                      key={ord.id_pedido}
                      className={`text-[9px] font-bold px-1 py-0.5 rounded truncate flex items-center gap-0.5 ${
                        entregadoHoy
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : canceladoHoy
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      <Egg className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{ord.cantidad_planchas} planchas</span>
                    </div>
                  );
                })}
                {dayOrders.length > 2 && (
                  <span className="text-[8px] text-slate-500 font-bold block text-right">
                    +{dayOrders.length - 2} más
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 pt-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Entregado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pendiente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Cancelado
        </span>
      </div>
    </div>
  );
}
