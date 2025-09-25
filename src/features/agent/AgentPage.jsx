import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, FileText, Bell, Clock
} from 'lucide-react';
import apiClient from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import ViewScheduleModal from '../../components/agent/ViewScheduleModal';
import RequestLeaveModal from '../../components/agent/RequestLeaveModal';
import ViewNoticesModal from '../../components/agent/ViewNoticesModal';

const AgentPage = () => {
  const { user } = useAuthStore();
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [notices, setNotices] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showNoticesModal, setShowNoticesModal] = useState(false);

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    setLoading(true);
    try {
      setTodaySchedule([
        { id: 1, shift: 'Morning Shift', time: '08:00-16:00', status: 'confirmed' },
        { id: 2, shift: 'Break', time: '12:00-13:00', status: 'break' }
      ]);
      
      setNotices([
        { id: 1, title: 'System Maintenance Notice', time: '2024-01-15 10:00', unread: true },
        { id: 2, title: 'New Policy Announcement', time: '2024-01-14 15:30', unread: false }
      ]);
      
      setLeaveBalance({ annual: 12, sick: 5, personal: 3 });
    } catch (error) {
      console.error('Failed to load agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base">Welcome back, {user?.name || 'Agent'}</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
            <AvatarFallback className="text-sm">
              {user?.name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm sm:text-base">{user?.name || 'Agent'}</div>
            <Badge variant="secondary" className="text-xs">
              {user?.role || 'Agent'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading...
              </div>
            ) : todaySchedule.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No schedule today
              </div>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map(schedule => (
                  <div key={schedule.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">{schedule.shift}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {schedule.time}
                      </div>
                    </div>
                    <Badge 
                      variant={schedule.status === 'confirmed' ? 'default' : 'secondary'}
                      className="text-xs self-start sm:self-auto"
                    >
                      {schedule.status === 'confirmed' ? 'Confirmed' : 'Break'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notices */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              Latest Notices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading...
              </div>
            ) : notices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No notices
              </div>
            ) : (
              <div className="space-y-3">
                {notices.map(notice => (
                  <div key={notice.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="font-medium text-gray-900 flex-1">{notice.title}</div>
                      {notice.unread && (
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">📅 {notice.time}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex flex-col gap-2 text-center"
              onClick={() => setShowScheduleModal(true)}
            >
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm">View Schedule</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex flex-col gap-2 text-center"
              onClick={() => setShowLeaveModal(true)}
            >
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm">Request Leave</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex flex-col gap-2 text-center"
              onClick={() => setShowNoticesModal(true)}
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm">View Notices</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balance */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Leave Balance</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{leaveBalance.annual || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Annual (Days)</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{leaveBalance.sick || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Sick (Days)</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{leaveBalance.personal || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Personal (Days)</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Modals */}
      <ViewScheduleModal 
        isOpen={showScheduleModal} 
        onClose={() => setShowScheduleModal(false)} 
      />
      <RequestLeaveModal 
        isOpen={showLeaveModal} 
        onClose={() => setShowLeaveModal(false)} 
      />
      <ViewNoticesModal 
        isOpen={showNoticesModal} 
        onClose={() => setShowNoticesModal(false)} 
      />
    </div>
  );
};

export default AgentPage;