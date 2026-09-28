'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

interface SafeCalendarProps {
  events: any[];
}

export default function SafeCalendar({ events }: SafeCalendarProps) {
  return (
    <FullCalendar
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
}
