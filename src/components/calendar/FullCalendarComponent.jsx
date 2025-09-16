import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const FullCalendarComponent = ({ events = [], onDateClick, onEventClick }) => {
  console.log('FullCalendar received events:', events);

  const handleDateClick = (info) => {
    if (onDateClick) {
      onDateClick({ dateStr: info.dateStr });
    }
  };

  const handleEventClick = (info) => {
    if (onEventClick) {
      onEventClick({ event: info.event });
    }
  };

  return (
    <div className="h-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="auto"
        aspectRatio={1.8}
        eventDisplay="block"
        dayMaxEvents={3}
        moreLinkClick="popover"
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        eventClassNames="cursor-pointer"
        dayCellClassNames="hover:bg-gray-50"
      />
    </div>
  );
};

export default FullCalendarComponent;