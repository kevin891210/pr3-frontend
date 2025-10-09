import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, User, Clock } from 'lucide-react';

const EmployeeResourceView = ({ events = [], onDateClick, onEventClick }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // 從事件中提取員工列表
  const employees = useMemo(() => {
    const employeeMap = new Map();
    events.forEach(event => {
      const memberId = event.extendedProps?.memberId;
      const memberName = event.extendedProps?.memberName;
      if (memberId && !employeeMap.has(memberId)) {
        employeeMap.set(memberId, {
          id: memberId,
          name: memberName || `Employee ${memberId.substring(0, 8)}`
        });
      }
    });
    return Array.from(employeeMap.values());
  }, [events]);

  // 生成當週日期
  const weekDates = useMemo(() => {
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // 調整到週日

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeek]);

  // 按員工和日期組織事件
  const organizedEvents = useMemo(() => {
    const organized = {};
    
    events.forEach(event => {
      const memberId = event.extendedProps?.memberId;
      const eventDate = new Date(event.start).toDateString();
      
      if (!organized[memberId]) {
        organized[memberId] = {};
      }
      if (!organized[memberId][eventDate]) {
        organized[memberId][eventDate] = [];
      }
      organized[memberId][eventDate].push(event);
    });
    
    return organized;
  }, [events, weekDates]);

  const handlePrevWeek = () => {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeek(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeek(nextWeek);
  };

  const handleEventClick = (event) => {
    if (onEventClick) {
      onEventClick({ event });
    }
  };

  const handleDateClick = (date) => {
    if (onDateClick) {
      onDateClick({ dateStr: date.toISOString().split('T')[0] });
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* 週導航 */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handlePrevWeek}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {weekDates[0]?.toLocaleDateString()} - {weekDates[6]?.toLocaleDateString()}
        </h2>
        <Button variant="outline" size="sm" onClick={handleNextWeek}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* 日期標題 */}
      <div className="grid grid-cols-8 gap-1">
        <div className="p-2 font-medium text-gray-600">Employee</div>
        {weekDates.map((date, index) => (
          <div key={index} className="p-2 text-center font-medium text-gray-600 border-l">
            <div className="text-sm">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}</div>
            <div className="text-xs">{date.getDate()}</div>
          </div>
        ))}
      </div>

      {/* 員工排班表 */}
      <div className="space-y-1">
        {employees.length > 0 ? (
          employees.map(employee => (
            <Card key={employee.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-8 gap-1 min-h-[80px]">
                  {/* 員工名稱 */}
                  <div className="p-3 bg-gray-50 flex items-center border-r">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm">{employee.name}</span>
                    </div>
                  </div>

                  {/* 每日排班 */}
                  {weekDates.map((date, dateIndex) => {
                    const dateStr = date.toDateString();
                    const dayEvents = organizedEvents[employee.id]?.[dateStr] || [];
                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                      <div 
                        key={dateIndex}
                        className={`p-2 border-l cursor-pointer hover:bg-gray-50 ${
                          isToday ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleDateClick(date)}
                      >
                        {dayEvents.length > 0 ? (
                          <div className="space-y-1">
                            {dayEvents.map((event, eventIndex) => (
                              <div
                                key={eventIndex}
                                className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                                style={{
                                  backgroundColor: event.backgroundColor || '#3b82f6',
                                  color: event.textColor || '#ffffff'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(event);
                                }}
                              >
                                <div className="font-medium truncate">
                                  {event.extendedProps?.templateName || 'Shift'}
                                </div>
                                <div className="flex items-center gap-1 opacity-90">
                                  <Clock className="w-2 h-2" />
                                  <span>
                                    {formatTime(event.start)} - {formatTime(event.end)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400">
                            <span className="text-xs">-</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Employees Found</h3>
              <p className="text-gray-500">No schedule assignments available for this period.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 統計信息 */}
      {employees.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total Employees: {employees.length}</span>
              <span>
                Total Shifts: {weekDates.reduce((total, date) => {
                  const dateStr = date.toDateString();
                  return total + employees.reduce((dayTotal, emp) => {
                    return dayTotal + (organizedEvents[emp.id]?.[dateStr]?.length || 0);
                  }, 0);
                }, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeResourceView;