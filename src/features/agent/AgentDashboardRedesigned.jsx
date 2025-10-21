import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Bell, User, LogOut, Clock, FileText, 
  TrendingUp, CheckCircle, AlertCircle, Plus,
  Sun, Moon, Coffee, Home
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/services/api';
import RequestLeaveModal from '@/components/agent/RequestLeaveModal';
import SimpleCalendar from '@/components/calendar/SimpleCalendar';
import MobileScheduleView from '@/components/agent/MobileScheduleView';

const AgentDashboardRedesigned = () => {
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
            const template = assignment.shift_template;
            const startTime = template?.start_time || '09:00';
            const endTime = template?.end_time || '18:00';
            
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: Sun, color: 'text-yellow-500' };
    if (hour < 17) return { text: 'Good Afternoon', icon: Sun, color: 'text-orange-500' };
    if (hour < 21) return { text: 'Good Evening', icon: Moon, color: 'text-purple-500' };
    return { text: 'Good Night', icon: Moon, color: 'text-indigo-500' };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-40">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Agent Portal
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <GreetingIcon className={`w-4 h-4 ${greeting.color}`} />
                    <span>{greeting.text}, {user?.member_name || 'Agent'}!</span>
                  </div>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="border-gray-200 hover:border-red-300 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-6 sm:py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Today's Shifts</p>
                  <p className="text-2xl font-bold">
                    {schedule.filter(s => s.start.startsWith(new Date().toISOString().split('T')[0])).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Leave Balance</p>
                  <p className="text-2xl font-bold">
                    {Array.isArray(leaveBalance) ? 
                      leaveBalance.reduce((sum, b) => sum + (b.remaining_days || 0), 0) : 0}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Pending Requests</p>
                  <p className="text-2xl font-bold">
                    {Array.isArray(leaveRequests) ? 
                      leaveRequests.filter(r => r.status === 'pending').length : 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">New Notices</p>
                  <p className="text-2xl font-bold">
                    {Array.isArray(notices) ? notices.length : 0}
                  </p>
                </div>
                <Bell className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Schedule Calendar - Takes 2 columns on xl screens */}
          <div className="xl:col-span-2">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  My Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mobile Schedule View */}
                <div className="block lg:hidden">
                  <MobileScheduleView events={Array.isArray(schedule) ? schedule : []} />
                </div>
                
                {/* Desktop Calendar View */}
                <div className="hidden lg:block min-h-[500px]">
                  <SimpleCalendar
                    events={Array.isArray(schedule) ? schedule : []}
                    onDateClick={() => {}}
                    onEventClick={() => {}}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={() => setShowLeaveModal(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Request Leave
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border-gray-200 hover:border-purple-300 hover:text-purple-600 transition-all duration-200"
                  onClick={() => window.location.reload()}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </CardContent>
            </Card>

            {/* Leave Balance */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  Leave Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(leaveBalance) && leaveBalance.length > 0 ? (
                  <div className="space-y-3">
                    {leaveBalance
                      .filter(balance => balance.total_days > 0)
                      .map((balance) => (
                        <div key={balance.id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-gray-800">{balance.leave_type_name}</span>
                            <span className="text-2xl font-bold text-green-600">{balance.remaining_days}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(balance.remaining_days / balance.total_days) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {balance.remaining_days} of {balance.total_days} days remaining
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No leave balance data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Leave Requests */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  Recent Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(leaveRequests) && leaveRequests.length > 0 ? (
                  <div className="space-y-3">
                    {leaveRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-gray-900">{request.leave_type_name}</h4>
                          <div className="flex items-center space-x-1">
                            {request.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                            {request.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {request.status === 'rejected' && <AlertCircle className="w-4 h-4 text-red-500" />}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{request.days} days</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent requests</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Latest Notices */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  Latest Notices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(notices) && notices.length > 0 ? (
                  <div className="space-y-3">
                    {notices.slice(0, 3).map((notice, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
                        <h4 className="font-semibold text-gray-900 mb-2">{notice.title}</h4>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{notice.content}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No notices available</p>
                  </div>
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

export default AgentDashboardRedesigned;