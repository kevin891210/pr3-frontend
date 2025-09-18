import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Activity, AlertTriangle, CheckCircle, XCircle, 
  RefreshCw, Zap, Clock, TrendingUp 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/services/api.js';
import { useAuthStore } from '@/store/authStore.jsx';

const AttendanceMonitor = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState({
    overallStatus: 'normal',
    apiSuccessRate: 0,
    lastCheckDelay: 0,
    avgResponseTime: 0,
    absenteeRate: 0,
    systemLoad: 'unknown'
  });

  const [alerts, setAlerts] = useState([]);
  const [checkStatus, setCheckStatus] = useState([]);

  const performanceData = [
    { time: '09:00', successRate: 98, responseTime: 220 },
    { time: '09:15', successRate: 95, responseTime: 450 },
    { time: '09:30', successRate: 99, responseTime: 180 },
    { time: '09:45', successRate: 97, responseTime: 320 },
    { time: '10:00', successRate: 98, responseTime: 245 }
  ];

  useEffect(() => {
    loadMonitoringData();
    const interval = setInterval(loadMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMonitoringData = async () => {
    try {
      setError(null);
      
      const workspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      
      if (!workspaceId) {
        throw new Error('Workspace ID not found. Please login again.');
      }
      
      const response = await apiClient.getAttendanceMonitoring(workspaceId);
      
      if (response.data) {
        if (response.data.systemHealth) {
          setSystemHealth(response.data.systemHealth);
        }
        if (response.data.alerts && Array.isArray(response.data.alerts)) {
          setAlerts(response.data.alerts);
        }
        if (response.data.checkStatus && Array.isArray(response.data.checkStatus)) {
          setCheckStatus(response.data.checkStatus);
        }
      }
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const workspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      
      if (!workspaceId) {
        throw new Error('Workspace ID not found. Please login again.');
      }
      
      await apiClient.testAttendanceApiConnection(workspaceId);
      alert(t('attendance.connectionTestSuccess'));
      loadMonitoringData(); // Refresh data after test
    } catch (error) {
      console.error('Connection test failed:', error);
      alert(t('attendance.connectionTestFailed') + ': ' + error.message);
    }
  };

  const statusColors = {
    normal: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  const alertColors = {
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200'
  };

  const handleTriggerCheck = async (workspaceId) => {
    try {
      const currentWorkspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      
      if (!currentWorkspaceId) {
        throw new Error('Workspace ID not found. Please login again.');
      }
      
      setCheckStatus(prev => prev.map(ws => 
        ws.id === workspaceId ? { ...ws, status: 'checking', progress: 0 } : ws
      ));
      
      await apiClient.syncAttendanceData(currentWorkspaceId, { target_workspace_id: workspaceId });
      
      // Refresh monitoring data after sync
      setTimeout(loadMonitoringData, 2000);
    } catch (error) {
      console.error('Failed to trigger check:', error);
      alert(t('attendance.triggerCheckFailed') + ': ' + error.message);
    }
  };

  const handleResolveAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved' } : alert
    ));
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
          <div className="flex gap-2 mt-2">
            <button 
              onClick={loadMonitoringData}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
            <button 
              onClick={handleTestConnection}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Connection
            </button>
          </div>
        </div>
      )}
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('attendance.systemStatus')}</p>
              <p className={`text-2xl font-bold ${statusColors[systemHealth.overallStatus]}`}>
                {t(`attendance.systemStatus.${systemHealth.overallStatus}`)}
              </p>
            </div>
            <Activity className={`w-8 h-8 ${statusColors[systemHealth.overallStatus]}`} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('attendance.apiSuccessRate')}</p>
              <p className="text-2xl font-bold text-green-600">{systemHealth.apiSuccessRate}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('attendance.avgResponseTime')}</p>
              <p className="text-2xl font-bold text-blue-600">{systemHealth.avgResponseTime}ms</p>
            </div>
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('attendance.absenteeRate')}</p>
              <p className="text-2xl font-bold text-orange-600">{systemHealth.absenteeRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {t('attendance.systemAlerts')}
        </h3>
        
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border ${alertColors[alert.level]}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm opacity-75">{alert.timestamp}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {t(`attendance.alertStatus.${alert.status}`)}
                  </span>
                  
                  {alert.status === 'active' && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-3 py-1 bg-white bg-opacity-50 rounded text-xs font-medium hover:bg-opacity-75"
                    >
                      {t('attendance.resolve')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Check Status */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          {t('attendance.realtimeCheckStatus')}
        </h3>
        
        <div className="space-y-4">
          {checkStatus.map((workspace) => (
            <div key={workspace.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{workspace.workspace}</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    workspace.status === 'completed' ? 'bg-green-100 text-green-800' :
                    workspace.status === 'checking' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {t(`attendance.checkStatus.${workspace.status}`)}
                  </span>
                  
                  <button
                    onClick={() => handleTriggerCheck(workspace.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                  >
                    {t('attendance.triggerCheck')}
                  </button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{t('attendance.progress')}</span>
                  <span>{workspace.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${workspace.progress}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">{t('attendance.successCount')}:</span>
                  <span className="font-medium ml-1 text-green-600">{workspace.successCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('attendance.failureCount')}:</span>
                  <span className="font-medium ml-1 text-red-600">{workspace.failureCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('attendance.estimatedTime')}:</span>
                  <span className="font-medium ml-1">{workspace.estimatedTime}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">{t('attendance.performanceTrend')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="successRate" 
              stroke="#10B981" 
              strokeWidth={2}
              name={t('attendance.successRate')}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="responseTime" 
              stroke="#3B82F6" 
              strokeWidth={2}
              name={t('attendance.responseTime')}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceMonitor;