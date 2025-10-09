import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ScheduleSummaryView from './ScheduleSummaryView';

const FullCalendarComponent = ({ events = [], onDateClick, onEventClick, viewMode = 'calendar' }) => {
  console.log('FullCalendar received events:', events);
  
  // 從事件中提取資源（員工）
  const resources = React.useMemo(() => {
    const memberMap = new Map();
    events.forEach(event => {
      const memberId = event.extendedProps?.memberId;
      const memberName = event.extendedProps?.memberName;
      if (memberId && !memberMap.has(memberId)) {
        memberMap.set(memberId, {
          id: memberId,
          title: memberName || `Member ${memberId.substring(0, 8)}`
        });
      }
    });
    return Array.from(memberMap.values());
  }, [events]);
  
  // 為資源視圖轉換事件格式
  const resourceEvents = React.useMemo(() => {
    return events.map(event => ({
      ...event,
      resourceId: event.extendedProps?.memberId
    }));
  }, [events]);

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

  // 根據視圖模式選擇配置
  const getCalendarConfig = () => {
    if (viewMode === 'resource' && resources.length > 0) {
      return {
        plugins: [resourceDayGridPlugin, resourceTimeGridPlugin, interactionPlugin],
        initialView: 'resourceDayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'resourceDayGridMonth,resourceTimeGridWeek,resourceTimeGridDay'
        },
        resources: resources,
        events: resourceEvents,
        resourceAreaHeaderContent: 'Employees',
        resourceAreaWidth: '200px'
      };
    } else if (viewMode === 'list') {
      return {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'listWeek',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'listWeek,listMonth'
        },
        events: events
      };
    } else {
      return {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: events,
        dayMaxEvents: false,
        dayMaxEventRows: 10,
        moreLinkClick: 'popover'
      };
    }
  };
  
  const config = getCalendarConfig();

  // 如果是統計視圖，使用自定義組件
  if (viewMode === 'summary') {
    return (
      <ScheduleSummaryView
        events={events}
        onDateClick={onDateClick}
        onEventClick={onEventClick}
      />
    );
  }

  return (
    <div className="h-full">
      <style>{`
        .fc-event {
          font-size: 11px !important;
          line-height: 1.2 !important;
          padding: 1px 2px !important;
          margin-bottom: 1px !important;
        }
        .fc-event-title {
          font-weight: 500 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        .fc-daygrid-event {
          min-height: 18px !important;
        }
        .fc-daygrid-day-events {
          margin-bottom: 0 !important;
        }
        .fc-daygrid-day-frame {
          min-height: 120px !important;
        }
        .fc-more-link {
          font-size: 10px !important;
          padding: 1px 3px !important;
        }
        .fc-resource-area {
          background: #f8f9fa !important;
          border-right: 2px solid #dee2e6 !important;
        }
        .fc-resource {
          padding: 8px !important;
          border-bottom: 1px solid #e9ecef !important;
        }
        .fc-resource-title {
          font-weight: 500 !important;
          font-size: 12px !important;
        }
        .fc-list-event {
          cursor: pointer !important;
        }
        .fc-list-event:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
      <FullCalendar
        {...config}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="auto"
        aspectRatio={viewMode === 'resource' ? 1.2 : 1.8}
        eventDisplay="block"
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
        eventClassNames="cursor-pointer text-xs"
        dayCellClassNames="hover:bg-gray-50"
        eventMinHeight={20}
        eventShortHeight={15}
      />
    </div>
  );
};

export default FullCalendarComponent;