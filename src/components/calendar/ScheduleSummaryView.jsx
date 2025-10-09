import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const ScheduleSummaryView = ({ events = [], onDateClick, onEventClick }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 按日期分組事件並統計
  const dailySummary = useMemo(() => {
    const summary = {};
    
    events.forEach(event => {
      const date = new Date(event.start).toISOString().split('T')[0];
      if (!summary[date]) {
        summary[date] = {
          date,
          events: [],
          employeeCount: 0,
          shifts: {}
        };
      }
      
      summary[date].events.push(event);
      summary[date].employeeCount++;
      
      const shiftName = event.extendedProps?.templateName || 'Unknown';
      if (!summary[date].shifts[shiftName]) {
        summary[date].shifts[shiftName] = 0;
      }
      summary[date].shifts[shiftName]++;
    });
    
    return summary;
  }, [events]);

  // 生成當月日期網格
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateStr = current.toISOString().split('T')[0];
      const isCurrentMonth = current.getMonth() === month;
      const summary = dailySummary[dateStr];
      
      days.push({
        date: new Date(current),
        dateStr,
        isCurrentMonth,
        summary
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    if (onDateClick) {
      onDateClick({ dateStr });
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const selectedDateSummary = selectedDate ? dailySummary[selectedDate] : null;

  return (
    <div className="space-y-4">
      {/* 月份導航 */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handlePrevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {currentMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </h2>
        <Button variant="outline" size="sm" onClick={handleNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* 星期標題 */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-600">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2">{day}</div>
        ))}
      </div>

      {/* 日期網格 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <Card 
            key={index}
            className={`
              min-h-[80px] cursor-pointer transition-colors hover:bg-gray-50
              ${!day.isCurrentMonth ? 'opacity-40' : ''}
              ${day.summary ? 'border-blue-200 bg-blue-50' : ''}
            `}
            onClick={() => handleDateClick(day.dateStr)}
          >
            <CardContent className="p-2">
              <div className="text-sm font-medium mb-1">
                {day.date.getDate()}
              </div>
              
              {day.summary && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Users className="w-3 h-3" />
                    <span>{day.summary.employeeCount} people</span>
                  </div>
                  
                  <div className="space-y-0.5">
                    {Object.entries(day.summary.shifts).slice(0, 2).map(([shift, count]) => (
                      <div key={shift} className="text-xs text-gray-600 truncate">
                        {shift}: {count}
                      </div>
                    ))}
                    {Object.keys(day.summary.shifts).length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{Object.keys(day.summary.shifts).length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 詳情對話框 */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Schedule Details - {selectedDate && new Date(selectedDate).toLocaleDateString()}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDateSummary && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{selectedDateSummary.employeeCount} Employees</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{Object.keys(selectedDateSummary.shifts).length} Shift Types</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Shift Summary</h3>
                {Object.entries(selectedDateSummary.shifts).map(([shift, count]) => (
                  <div key={shift} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{shift}</span>
                    <span className="text-sm text-gray-600">{count} people</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Employee List</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {selectedDateSummary.events.map(event => (
                    <div 
                      key={event.id}
                      className="flex justify-between items-center p-2 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => onEventClick && onEventClick({ event })}
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {event.extendedProps?.memberName || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {event.extendedProps?.templateName || 'Unknown Shift'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.extendedProps?.startTime} - {event.extendedProps?.endTime}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleSummaryView;