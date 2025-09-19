import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Bell, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/services/api';
import RequestLeaveModal from '@/components/agent/RequestLeaveModal';
import SimpleCalendar from '@/components/calendar/SimpleCalendar';

const AgentDashboardPage = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
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
      
      // Load profile
      try {
        const profileRes = await apiClient.getAgentProfile(user?.id, user?.workspace_id);
        setProfile(profileRes.data || profileRes);
      } catch (profileError) {
        console.warn('Failed to load profile:', profileError.message);
        setProfile(null);
      }
      
      // Load notices
      try {
        const noticesRes = await apiClient.getAgentNotices(user?.workspace_id);
        setNotices(Array.isArray(noticesRes.data) ? noticesRes.data : []);
      } catch (noticesError) {
        console.warn('Failed to load notices:', noticesError.message);
        setNotices([]);
      }
      
      // Load schedule
      try {
        const scheduleRes = await apiClient.getScheduleAssignments({ 
          member_id: memberId,
          start_date: today,
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        const scheduleData = scheduleRes?.data || [];
        
        if (Array.isArray(scheduleData) && scheduleData.length > 0) {
          const calendarEvents = scheduleData.map(assignment => ({
            id: assignment.id,
            title: assignment.shift_name || 'Work Shift',
            start: assignment.start_datetime || assignment.date,
            end: assignment.end_datetime || assignment.date,
            backgroundColor: '#3b82f6',
            borderColor: '#1d4ed8'
          }));
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
        const balanceRes = await apiClient.getAgentLeaveBalance(memberId);
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
      setProfile(null);
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Agent Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <User className="w-4 h-4 mr-2" />
                {user?.member_name || profile?.name || user?.name || 'Agent'}
                <LogOut className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Schedule Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                My Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleCalendar
                events={Array.isArray(schedule) ? schedule : []}
                onDateClick={() => {}}
                onEventClick={() => {}}
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Leave Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Leave Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(leaveBalance) && leaveBalance.length > 0 ? (
                  <div className="space-y-2">
                    {leaveBalance.map((balance) => (
                      <div key={balance.id} className="flex justify-between">
                        <span className="text-sm">{balance.leave_type_name}:</span>
                        <span className="font-medium">{balance.remaining_days} days</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No leave balance data</p>
                )}
                <Button 
                  className="w-full mt-4" 
                  onClick={() => setShowLeaveModal(true)}
                >
                  Request Leave
                </Button>
              </CardContent>
            </Card>

            {/* Leave Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  My Leave Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(leaveRequests) && leaveRequests.length > 0 ? (
                  <div className="space-y-3">
                    {leaveRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{request.leave_type_name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">{request.days} days</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No leave requests</p>
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
              {Array.isArray(notices) && notices.length > 0 ? (
                <div className="space-y-3">
                  {notices.slice(0, 5).map((notice, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{notice.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notice.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No notices available</p>
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
      />
    </div>
  );
};

export default AgentDashboardPage;