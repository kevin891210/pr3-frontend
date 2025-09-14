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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name || 'Agent'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback>
              {user?.name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user?.name || 'Agent'}</div>
            <Badge variant="secondary" className="text-xs">
              {user?.role || 'Agent'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : todaySchedule.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No schedule today</div>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map(schedule => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{schedule.shift}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {schedule.time}
                      </div>
                    </div>
                    <Badge 
                      variant={schedule.status === 'confirmed' ? 'default' : 'secondary'}
                      className="text-xs"
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Latest Notices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : notices.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No notices</div>
            ) : (
              <div className="space-y-3">
                {notices.map(notice => (
                  <div key={notice.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {notice.title}
                        {notice.unread && (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{notice.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => setShowScheduleModal(true)}
            >
              <Calendar className="w-6 h-6" />
              <span className="text-sm">View Schedule</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => setShowLeaveModal(true)}
            >
              <FileText className="w-6 h-6" />
              <span className="text-sm">Request Leave</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => setShowNoticesModal(true)}
            >
              <Bell className="w-6 h-6" />
              <span className="text-sm">View Notices</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{leaveBalance.annual || 0}</div>
              <div className="text-sm text-gray-600">Annual (Days)</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{leaveBalance.sick || 0}</div>
              <div className="text-sm text-gray-600">Sick (Days)</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{leaveBalance.personal || 0}</div>
              <div className="text-sm text-gray-600">Personal (Days)</div>
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