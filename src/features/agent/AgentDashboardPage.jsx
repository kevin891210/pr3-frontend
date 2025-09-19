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
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [profileRes, scheduleRes, noticesRes, balanceRes] = await Promise.all([
        apiClient.getAgentProfile(user?.id, user?.workspace_id),
        apiClient.getAgentSchedule(user?.id, today),
        apiClient.getAgentNotices(user?.workspace_id),
apiClient.getAgentLeaveBalance(localStorage.getItem('member_id') || user?.member_id)
      ]);

      setProfile(profileRes.data || profileRes);
      setSchedule(Array.isArray(scheduleRes.data) ? scheduleRes.data : (scheduleRes.data ? [scheduleRes.data] : []));
      setNotices(Array.isArray(noticesRes.data) ? noticesRes.data : (noticesRes.data ? [noticesRes.data] : []));
      const balanceData = balanceRes.data || balanceRes || [];
      setLeaveBalance(Array.isArray(balanceData) ? balanceData : []);
    } catch (error) {
      console.error('Failed to load agent data:', error);
      setProfile(null);
      setSchedule([]);
      setNotices([]);
      setLeaveBalance({});
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