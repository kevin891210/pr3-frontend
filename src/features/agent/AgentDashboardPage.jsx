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
      const [profileRes, scheduleRes, noticesRes, balanceRes] = await Promise.all([
        apiClient.getAgentProfile(),
        apiClient.getScheduleAssignments({ userId: user?.id }),
        apiClient.getAgentNotices(),
        apiClient.getAgentLeaveBalance()
      ]);

      setProfile(profileRes.data || profileRes);
      setSchedule(scheduleRes.data || scheduleRes);
      setNotices(noticesRes.data || noticesRes);
      setLeaveBalance(balanceRes.data || balanceRes);
    } catch (error) {
      console.error('Failed to load agent data:', error);
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
              <h1 className="text-xl font-semibold text-gray-900">{t('agent.dashboard')}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">{profile?.name || user?.name || 'Agent'}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                {t('common.logout')}
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
                {t('agent.mySchedule')}
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
                  {t('agent.leaveBalance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(leaveBalance).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(leaveBalance).map(([type, balance]) => (
                      <div key={type} className="flex justify-between">
                        <span className="text-sm">{type}:</span>
                        <span className="font-medium">{balance.remaining || 0} {t('common.days')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">{t('agent.noLeaveData')}</p>
                )}
                <Button 
                  className="w-full mt-4" 
                  onClick={() => setShowLeaveModal(true)}
                >
                  {t('agent.requestLeave')}
                </Button>
              </CardContent>
            </Card>

            {/* Notices */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {t('agent.latestNotices')}
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
                <p className="text-gray-500">{t('agent.noNotices')}</p>
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