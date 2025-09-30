import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const MobileScheduleView = ({ events = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigateWeek = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction * 7));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(currentDate.getDate() - day);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      if (!event.start) return false;
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return '';
    }
  };

  const weekDates = getWeekDates();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)} className="p-2">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek(1)} className="p-2">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday} className="text-sm px-3">
          Today
        </Button>
      </div>

      {/* Week View */}
      <div className="space-y-3">
        {weekDates.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayEvents = getEventsForDate(date);
          const isToday = dateStr === todayStr;
          const isPast = date < today && !isToday;

          return (
            <Card key={dateStr} className={`${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`text-center ${isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900'}`}>
                      <div className="text-xs font-medium">{dayNames[index]}</div>
                      <div className="text-lg font-bold">{date.getDate()}</div>
                      <div className="text-xs">{monthNames[date.getMonth()]}</div>
                    </div>
                    {isToday && (
                      <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                        Today
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {dayEvents.length} {dayEvents.length === 1 ? 'shift' : 'shifts'}
                    </div>
                  </div>
                </div>

                {dayEvents.length > 0 ? (
                  <div className="space-y-2">
                    {dayEvents.map((event, eventIndex) => (
                      <div 
                        key={eventIndex}
                        className={`p-3 rounded-lg border-l-4 ${
                          isToday ? 'bg-white border-l-blue-500' : 
                          isPast ? 'bg-gray-50 border-l-gray-300' : 'bg-blue-50 border-l-blue-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className={`font-medium ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                              {event.title || 'Work Shift'}
                            </span>
                          </div>
                          {(event.start || event.end) && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>
                                {formatTime(event.start)}
                                {event.end && formatTime(event.end) && ` - ${formatTime(event.end)}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No shifts scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MobileScheduleView;