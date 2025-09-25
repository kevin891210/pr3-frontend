import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SimpleCalendar = ({ events = [], onDateClick, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  console.log('SimpleCalendar received events:', events);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getEventsForDate = (dateStr) => {
    const dayEvents = events.filter(event => {
      if (!event.start) return false;
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
    console.log(`Events for ${dateStr}:`, dayEvents);
    return dayEvents;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    
    const days = [];
    const today = new Date();
    const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 sm:h-24 border border-gray-200"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day);
      const dayEvents = getEventsForDate(dateStr);
      const isToday = dateStr === todayStr;

      days.push(
        <div
          key={day}
          className={`h-16 sm:h-24 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 ${
            isToday ? 'bg-blue-50 border-blue-300' : ''
          }`}
          onClick={() => onDateClick && onDateClick({ dateStr })}
        >
          <div className={`text-xs sm:text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="mt-1 space-y-1">
            {dayEvents.slice(0, window.innerWidth < 640 ? 1 : 2).map((event, index) => (
              <div
                key={index}
                className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick && onEventClick({ event });
                }}
              >
                <span className="hidden sm:inline">{event.title}</span>
                <span className="sm:hidden">•</span>
              </div>
            ))}
            {dayEvents.length > (window.innerWidth < 640 ? 1 : 2) && (
              <div className="text-xs text-gray-500">
                <span className="hidden sm:inline">+{dayEvents.length - 2} more</span>
                <span className="sm:hidden">+{dayEvents.length - 1}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border-b gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)} className="p-2">
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth(1)} className="p-2">
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs sm:text-sm px-2 sm:px-3">
            Today
          </Button>
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-center sm:text-left">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {dayNames.map(day => (
          <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-700 border-r last:border-r-0">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default SimpleCalendar;