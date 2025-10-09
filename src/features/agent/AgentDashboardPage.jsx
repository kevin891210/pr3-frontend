import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Bell, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/services/api';
import RequestLeaveModal from '@/components/agent/RequestLeaveModal';
import SimpleCalendar from '@/components/calendar/SimpleCalendar';
import MobileScheduleView from '@/components/agent/MobileScheduleView';

const AgentDashboardPage = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const [schedule, setSchedule] = useState([]);
  const [notices, setNotices] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const memberId = localStorage.getItem('member_id') || user?.member_id || user?.id;
      
      // Load notices
      try {
        const noticesRes = await apiClient.getNotices();
        setNotices(Array.isArray(noticesRes.data) ? noticesRes.data : []);
      } catch (noticesError) {
        console.warn('Failed to load notices:', noticesError.message);
        setNotices([]);
      }
      
      // Load schedule
      try {
        const scheduleRes = await apiClient.getAgentScheduleAssignments({ 
          member_id: memberId,
          start_date: today,
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        const scheduleData = scheduleRes?.data || [];
        
        if (Array.isArray(scheduleData) && scheduleData.length > 0) {
          const calendarEvents = scheduleData.map(assignment => {
            // Use shift_template data if available from JOIN query
            const template = assignment.shift_template;
            const startTime = template?.start_time || '09:00';
            const endTime = template?.end_time || '18:00';
            
            // Handle cross-day shifts
            let startDateTime, endDateTime;
            if (template?.is_cross_day && startTime > endTime) {
              startDateTime = `${assignment.date}T${startTime}:00`;
              const nextDay = new Date(assignment.date);
              nextDay.setDate(nextDay.getDate() + 1);
              const nextDayStr = nextDay.toISOString().split('T')[0];
              endDateTime = `${nextDayStr}T${endTime}:00`;
            } else {
              startDateTime = `${assignment.date}T${startTime}:00`;
              endDateTime = `${assignment.date}T${endTime}:00`;
            }
            
            return {
              id: assignment.id,
              title: template?.name || 'Work Shift',
              start: startDateTime,
              end: endDateTime,
              backgroundColor: '#3b82f6',
              borderColor: '#1d4ed8'
            };
          });
          setSchedule(calendarEvents);
        } else {
          setSchedule([]);
        }
      } catch (scheduleError) {
        console.warn('Failed to load schedule:', scheduleError.message);
        setSchedule([]);
      }
      
      // Load leave balance
      try {
        const balanceRes = await apiClient.getLeaveBalance(memberId, new Date().getFullYear());
        const balanceData = balanceRes?.data || [];
        setLeaveBalance(Array.isArray(balanceData) ? balanceData : []);
      } catch (balanceError) {
        console.warn('Failed to load leave balance:', balanceError.message);
        setLeaveBalance([]);
      }
      
      // Load leave requests
      try {
        const requestsRes = await apiClient.getLeaveRequests({ member_id: memberId });
        const requestsData = requestsRes?.data || [];
        setLeaveRequests(Array.isArray(requestsData) ? requestsData : []);
      } catch (requestsError) {
        console.warn('Failed to load leave requests:', requestsError.message);
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error('Failed to load agent data:', error);
      setSchedule([]);
      setNotices([]);
      setLeaveBalance([]);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/agent-login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Agent Dashboard</h1>
            </div>
            <div className="flex items-center">
              <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm px-2 sm:px-3">
                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{user?.member_name || 'Agent'}</span>
                <span className="sm:hidden">Me</span>
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Schedule Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                My Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Mobile Schedule View */}
              <div className="block sm:hidden">
                <MobileScheduleView events={Array.isArray(schedule) ? schedule : []} />
              </div>
              
              {/* Desktop Calendar View */}
              <div className="hidden sm:block min-h-[400px]">
                <SimpleCalendar
                  events={Array.isArray(schedule) ? schedule : []}
                  onDateClick={() => {}}
                  onEventClick={() => {}}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 sm:space-y-6">
            {/* Leave Balance */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  Leave Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {Array.isArray(leaveBalance) && leaveBalance.length > 0 ? (
                  <div className="space-y-3">
                    {leaveBalance
                      .filter(balance => balance.total_days > 0) // 過濾掉總天數為 0 的請假類型
                      .map((balance) => (
                        <div key={balance.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">{balance.leave_type_name}</span>
                          <span className="font-bold text-blue-600">{balance.remaining_days} days</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No leave balance data</p>
                )}
                <Button 
                  className="w-full mt-4 h-10 sm:h-11" 
                  onClick={() => setShowLeaveModal(true)}
                >
                  Request Leave
                </Button>
              </CardContent>
            </Card>

            {/* Leave Requests */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  My Leave Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {Array.isArray(leaveRequests) && leaveRequests.length > 0 ? (
                  <div className="space-y-3">
                    {leaveRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-3 border rounded-lg bg-white shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{request.leave_type_name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full self-start ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            📅 {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">⏱️ {request.days} days</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No leave requests</p>
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
              {Array.isArray(notices) && notices.length > 0 ? (
                <div className="space-y-3">
                  {notices.slice(0, 5).map((notice, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-white shadow-sm">
                      <h4 className="font-medium text-gray-900 mb-2">{notice.title}</h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{notice.content}</p>
                      <p className="text-xs text-gray-400">
                        📅 {new Date(notice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No notices available</p>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      </main>

      {/* Request Leave Modal */}
      <RequestLeaveModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        leaveBalance={leaveBalance}
      />
    </div>
  );
};

export default AgentDashboardPage;