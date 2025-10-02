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
      
      // 直接獲取所有工作區統計數據（包含品牌信息）
      const statisticsRes = await apiClient.getAllWorkspacesAttendanceStats();
      
      if (!statisticsRes.data || statisticsRes.data.length === 0) {
        throw new Error('No workspace data found');
      }
      
      // 處理統計數據
      if (statisticsRes.data) {
        const aggregatedStats = {
          todayAttendance: { present: 0, absent: 0, late: 0, leave: 0 },
          weeklyRate: 0,
          avgWorkHours: 0,
          overtimeHours: 0
        };
        
        // 聚合所有工作區的數據
        statisticsRes.data.forEach(workspaceStats => {
          if (workspaceStats.todayAttendance) {
            aggregatedStats.todayAttendance.present += workspaceStats.todayAttendance.present || 0;
            aggregatedStats.todayAttendance.absent += workspaceStats.todayAttendance.absent || 0;
            aggregatedStats.todayAttendance.late += workspaceStats.todayAttendance.late || 0;
            aggregatedStats.todayAttendance.leave += workspaceStats.todayAttendance.leave || 0;
          }
        });
        
        // 計算平均值
        const workspaceCount = statisticsRes.data.length;
        if (workspaceCount > 0) {
          aggregatedStats.weeklyRate = statisticsRes.data.reduce((sum, ws) => sum + (ws.weeklyRate || 0), 0) / workspaceCount;
          aggregatedStats.avgWorkHours = statisticsRes.data.reduce((sum, ws) => sum + (ws.avgWorkHours || 0), 0) / workspaceCount;
          aggregatedStats.overtimeHours = statisticsRes.data.reduce((sum, ws) => sum + (ws.overtimeHours || 0), 0);
        }
        
        setStats(aggregatedStats);
        
        // 設置趨勢數據（使用第一個工作區的數據作為示例）
        if (statisticsRes.data[0]?.attendanceTrend) {
          setAttendanceTrend(statisticsRes.data[0].attendanceTrend);
        }
      }
      
      // 使用統計數據中的工作區信息創建實時狀態
      const realtimeData = statisticsRes.data.map(workspaceStats => ({
        id: workspaceStats.workspaceId,
        workspace: `${workspaceStats.brandName} - ${workspaceStats.workspaceName}`,
        brandId: workspaceStats.brandId,
        brandName: workspaceStats.brandName,
        status: 'completed',
        onlineCount: workspaceStats.todayAttendance.present,
        scheduledCount: workspaceStats.todayAttendance.present + workspaceStats.todayAttendance.absent,
        nextCheck: 300
      }));
      
      setRealtimeStatus(realtimeData);
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
      setRealtimeStatus(prev => prev.map(ws => 
        ws.id === workspaceId ? { ...ws, status: 'checking' } : ws
      ));
      
      await apiClient.syncAttendanceData(workspaceId);
      
      // Refresh data after sync
      setTimeout(loadDashboardData, 2000);
    } catch (error) {
      console.error('Failed to trigger manual check:', error);
      alert('Manual check failed: ' + error.message);
    }
  };

  const handleCheckAll = async () => {
    try {
      setRealtimeStatus(prev => prev.map(ws => ({ ...ws, status: 'checking' })));
      
      // 並行檢查所有工作區
      const checkPromises = realtimeStatus.map(workspace => 
        apiClient.syncAttendanceData(workspace.id)
      );
      
      await Promise.allSettled(checkPromises);
      
      // Refresh data after sync
      setTimeout(loadDashboardData, 3000);
    } catch (error) {
      console.error('Failed to check all workspaces:', error);
      alert('Check all failed: ' + error.message);
    }
  };

  const handleViewAnomalies = () => {
    // 切換到記錄標籤頁並顯示異常過濾
    const event = new CustomEvent('switchAttendanceTab', { detail: { tab: 'records', filter: 'anomalies' } });
    window.dispatchEvent(event);
  };

  const handleExportReport = async () => {
    try {
      const workspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      const today = new Date().toISOString().split('T')[0];
      
      const response = await apiClient.exportAttendanceProof(workspaceId, {
        start_date: today,
        end_date: today,
        format: 'pdf'
      });
      
      if (response.success) {
        // 創建下載鏈接
        const link = document.createElement('a');
        link.href = response.data.export_url;
        link.download = `attendance_proof_${today}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
      alert(t('attendance.exportFailed') + ': ' + error.message);
    }
  };

  const handleSystemSettings = () => {
    // 切換到設定標籤頁
    const event = new CustomEvent('switchAttendanceTab', { detail: { tab: 'settings' } });
    window.dispatchEvent(event);
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
          <div className="text-red-800">連接錯誤: {error}</div>
          <div className="text-sm text-red-600 mt-1">
            請檢查後端服務是否正常運行，或聯繫系統管理員。
          </div>
          <button 
            onClick={loadDashboardData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            重試連接
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
          {realtimeStatus.length > 0 ? realtimeStatus.map((workspace) => (
            <div key={workspace.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{workspace.workspace}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[workspace.status] || 'text-gray-600'}`}>
                  {workspace.status === 'completed' ? '已完成' : 
                   workspace.status === 'checking' ? '檢查中' : 
                   workspace.status === 'idle' ? '待機中' : '未知'}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>在線人數:</span>
                  <span className="font-medium">{workspace.onlineCount}/{workspace.scheduledCount}</span>
                </div>
                
                {workspace.nextCheck > 0 && (
                  <div className="flex justify-between">
                    <span>下次檢查:</span>
                    <span className="font-medium">{Math.floor(workspace.nextCheck / 60)}:{(workspace.nextCheck % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleManualCheck(workspace.id)}
                className="w-full mt-3 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
              >
                <Play className="w-4 h-4 inline mr-1" />
                手動檢查
              </button>
            </div>
          )) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              <div className="text-lg mb-2">暫無工作區數據</div>
              <div className="text-sm">請確認已配置工作區並有排班記錄</div>
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">本週出勤趨勢</h3>
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
          <h3 className="text-lg font-semibold mb-4">快速操作</h3>
          <div className="space-y-3">
            <button 
              onClick={handleViewAnomalies}
              className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">查看今日異常</p>
                  <p className="text-sm text-gray-600">檢查遲到、早退或缺勤記錄</p>
                </div>
              </div>
            </button>

            <button 
              onClick={handleExportReport}
              className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">導出今日報表</p>
                  <p className="text-sm text-gray-600">生成 PDF 格式的出勤證明</p>
                </div>
              </div>
            </button>

            <button 
              onClick={handleSystemSettings}
              className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium">系統設定</p>
                  <p className="text-sm text-gray-600">配置出勤檢查參數</p>
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