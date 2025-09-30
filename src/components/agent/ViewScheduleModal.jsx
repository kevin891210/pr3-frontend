import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, X } from 'lucide-react';
import apiClient from '../../services/api';

const ViewScheduleModal = ({ isOpen, onClose }) => {
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSchedule();
    }
  }, [isOpen, selectedDate]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      setSchedules([
        { id: 1, shift: 'Morning Shift', time: '08:00-16:00', status: 'confirmed', date: selectedDate },
        { id: 2, shift: 'Lunch Break', time: '12:00-13:00', status: 'break', date: selectedDate }
      ]);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-semibold">View Schedule</h2>
          <Button variant="outline" size="sm" onClick={onClose} className="p-2">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 border rounded-md text-base h-12"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading...
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              No schedule for this date
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map(schedule => (
                <Card key={schedule.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">{schedule.shift}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {schedule.time}
                        </div>
                      </div>
                      <Badge 
                        variant={schedule.status === 'confirmed' ? 'default' : 'secondary'}
                        className="self-start sm:self-auto"
                      >
                        {schedule.status === 'confirmed' ? 'Confirmed' : 'Break'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewScheduleModal;