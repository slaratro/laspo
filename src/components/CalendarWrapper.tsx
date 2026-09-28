'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';

const FullCalendarComponent = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
      <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
      <span>Cargando calendario...</span>
    </div>
  ),
});

interface CalendarWrapperProps {
  events: any[];
}

export default function CalendarWrapper({ events }: CalendarWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        <span>Cargando vista...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-8 text-center text-slate-500">
        <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-amber-500" />
        <p className="font-semibold text-sm">No se pudo cargar la vista del calendario.</p>
        <p className="text-xs">Usa la lista de entregas a la derecha para gestionar los pedidos.</p>
      </div>
    );
  }

  try {
    return (
      <FullCalendarComponent
        plugins={[dayGridPlugin as any, interactionPlugin as any]}
        initialView="dayGridMonth"
        events={events}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek',
        }}
        height="auto"
      />
    );
  } catch (err) {
    console.error('Error rendering FullCalendar:', err);
    return (
      <div className="p-6 text-center text-slate-500">
        Error al desplegar el calendario.
      </div>
    );
  }
}
