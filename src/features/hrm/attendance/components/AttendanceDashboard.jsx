import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, Clock, TrendingUp, AlertTriangle, 
  CheckCircle, XCircle, RefreshCw, Play, FileText, Settings 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiClient } from '@/services/api.js';
import { useAuthStore } from '@/store/authStore.jsx';

const AttendanceDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    todayAttendance: { present: 0, absent: 0, late: 0, leave: 0 },
    weeklyRate: 0,
    avgWorkHours: 0,
    overtimeHours: 0
  });

  const [realtimeStatus, setRealtimeStatus] = useState([]);
  const [attendanceTrend, setAttendanceTrend] = useState([]);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      const workspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      
      if (!workspaceId) {
        throw new Error('Workspace ID not found. Please login again.');
      }
      
      const [statisticsRes, monitoringRes] = await Promise.all([
        apiClient.getAttendanceStatistics(workspaceId),
        apiClient.getAttendanceMonitoring(workspaceId)
      ]);
      
      if (statisticsRes.data) {
        setStats({
          todayAttendance: statisticsRes.data.todayAttendance || { present: 0, absent: 0, late: 0, leave: 0 },
          weeklyRate: statisticsRes.data.weeklyRate || 0,
          avgWorkHours: statisticsRes.data.avgWorkHours || 0,
          overtimeHours: statisticsRes.data.overtimeHours || 0
        });
        
        if (statisticsRes.data.attendanceTrend && Array.isArray(statisticsRes.data.attendanceTrend)) {
          setAttendanceTrend(statisticsRes.data.attendanceTrend);
        }
      }
      
      if (monitoringRes.data && monitoringRes.data.realtimeStatus && Array.isArray(monitoringRes.data.realtimeStatus)) {
        setRealtimeStatus(monitoringRes.data.realtimeStatus);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    checking: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800'
  };

  const handleManualCheck = async (workspaceId) => {
    try {
      const currentWorkspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      
      setRealtimeStatus(prev => prev.map(ws => 
        ws.id === workspaceId ? { ...ws, status: 'checking' } : ws
      ));
      
      await apiClient.syncAttendanceData(currentWorkspaceId, { target_workspace_id: workspaceId });
      
      // Refresh data after sync
      setTimeout(loadDashboardData, 2000);
    } catch (error) {
      console.error('Failed to trigger manual check:', error);
      alert('Manual check failed: ' + error.message);
    }
  };

  const handleCheckAll = async () => {
    try {
      const currentWorkspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      
      setRealtimeStatus(prev => prev.map(ws => ({ ...ws, status: 'checking' })));
      
      await apiClient.syncAttendanceData(currentWorkspaceId);
      
      // Refresh data after sync
      setTimeout(loadDashboardData, 3000);
    } catch (error) {
      console.error('Failed to check all workspaces:', error);
      alert('Check all failed: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-red-800">Error: {error}</div>
          <button 
            onClick={loadDashboardData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">{t('attendance.todayAttendance')}</p>
              <p className="text-2xl font-bold text-blue-900">{stats.todayAttendance.present}</p>
              <p className="text-xs text-blue-600">
                {t('attendance.absent')}: {stats.todayAttendance.absent} | 
                {t('attendance.late')}: {stats.todayAttendance.late}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">{t('attendance.weeklyRate')}</p>
              <p className="text-2xl font-bold text-green-900">{stats.weeklyRate}%</p>
              <p className="text-xs text-green-600">{t('attendance.thisWeek')}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">{t('attendance.avgWorkHours')}</p>
              <p className="text-2xl font-bold text-purple-900">{stats.avgWorkHours}h</p>
              <p className="text-xs text-purple-600">{t('attendance.daily')}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">{t('attendance.overtimeHours')}</p>
              <p className="text-2xl font-bold text-orange-900">{stats.overtimeHours}h</p>
              <p className="text-xs text-orange-600">{t('attendance.thisWeek')}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Realtime Status Monitor */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('attendance.realtimeMonitor')}</h3>
          <button
            onClick={handleCheckAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            {t('attendance.checkAllWorkspaces')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {realtimeStatus.map((workspace) => (
            <div key={workspace.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{workspace.workspace}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[workspace.status]}`}>
                  {t(`attendance.status.${workspace.status}`)}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('attendance.onlineCount')}:</span>
                  <span className="font-medium">{workspace.onlineCount}/{workspace.scheduledCount}</span>
                </div>
                
                {workspace.nextCheck > 0 && (
                  <div className="flex justify-between">
                    <span>{t('attendance.nextCheck')}:</span>
                    <span className="font-medium">{Math.floor(workspace.nextCheck / 60)}:{(workspace.nextCheck % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleManualCheck(workspace.id)}
                className="w-full mt-3 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
              >
                <Play className="w-4 h-4 inline mr-1" />
                {t('attendance.manualCheck')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">{t('attendance.weeklyTrend')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">{t('attendance.quickActions')}</h3>
          <div className="space-y-3">
            <button className="w-full p-4 text-left border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">{t('attendance.viewTodayAnomalies')}</p>
                  <p className="text-sm text-gray-600">{t('attendance.checkAnomaliesDesc')}</p>
                </div>
              </div>
            </button>

            <button className="w-full p-4 text-left border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">{t('attendance.exportTodayReport')}</p>
                  <p className="text-sm text-gray-600">{t('attendance.exportReportDesc')}</p>
                </div>
              </div>
            </button>

            <button className="w-full p-4 text-left border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium">{t('attendance.systemSettings')}</p>
                  <p className="text-sm text-gray-600">{t('attendance.configureSettings')}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;