import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Settings, Clock, Wifi, Bell, Save, 
  ToggleLeft, ToggleRight, TestTube, CheckCircle, 
  XCircle, RefreshCw, Activity 
} from 'lucide-react';
import { apiClient } from '@/services/api.js';
import { useAuthStore } from '@/store/authStore.jsx';

const AttendanceSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('check-settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState({});
  const [settings, setSettings] = useState({
    checkSettings: {
      preCheckWindow: 30,
      postCheckWindow: 60,
      autoCheckInterval: 15,
      lateToleranceMinutes: 10,
      earlyLeaveToleranceMinutes: 10,
      breakTimeToleranceMinutes: 5
    },
    apiSettings: {
      requestTimeout: 30,
      maxRetries: 3,
      retryInterval: 5
    },
    automationSettings: {
      enableAutoCheck: true,
      enableAnomalyNotification: true
    },
    workspaceSettings: []
  });

  useEffect(() => {
    loadAttendanceSettings();
  }, []);

  const loadAttendanceSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const workspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      
      if (!workspaceId) {
        throw new Error('Workspace ID not found. Please login again.');
      }
      
      console.log('Loading attendance settings for workspace:', workspaceId);
      
      // 同時載入設定和品牌列表
      const [settingsResponse, brandsResponse] = await Promise.allSettled([
        apiClient.getAttendanceSettings(workspaceId),
        apiClient.getBrands()
      ]);
      
      console.log('Attendance settings response:', settingsResponse);
      console.log('Brands response:', brandsResponse);
      
      // 處理工作區資料
      let workspaceSettings = [];
      if (brandsResponse.status === 'fulfilled' && brandsResponse.value?.data) {
        // 從所有 brands 中收集 workspaces
        for (const brand of brandsResponse.value.data) {
          try {
            const workspacesResponse = await apiClient.getBrandWorkspaces(brand.id);
            if (workspacesResponse.data && Array.isArray(workspacesResponse.data)) {
              const brandWorkspaces = workspacesResponse.data.map(workspace => ({
                id: workspace.id,
                name: workspace.name || `${brand.name} - Workspace ${workspace.id}`,
                timezone: workspace.timezone || 'Asia/Taipei',
                enabled: workspace.enabled !== false,
                brandId: brand.id,
                brandName: brand.name
              }));
              workspaceSettings.push(...brandWorkspaces);
            }
          } catch (error) {
            console.warn(`Failed to load workspaces for brand ${brand.id}:`, error);
          }
        }
      }
      
      // 如果沒有找到任何 workspace，使用預設資料
      if (workspaceSettings.length === 0) {
        workspaceSettings = [
          {
            id: workspaceId,
            name: `Workspace ${workspaceId}`,
            timezone: 'Asia/Taipei',
            enabled: true,
            brandId: 'default',
            brandName: 'Default Brand'
          }
        ];
      }
      
      // 處理設定資料
      let settingsData = {};
      if (settingsResponse.status === 'fulfilled' && settingsResponse.value?.data) {
        settingsData = settingsResponse.value.data;
      }
      
      setSettings({
        checkSettings: settingsData.checkSettings || {
          preCheckWindow: 30,
          postCheckWindow: 60,
          autoCheckInterval: 15,
          lateToleranceMinutes: 10,
          earlyLeaveToleranceMinutes: 10,
          breakTimeToleranceMinutes: 5
        },
        apiSettings: settingsData.apiSettings || {
          requestTimeout: 30,
          maxRetries: 3,
          retryInterval: 5
        },
        automationSettings: settingsData.automationSettings || {
          enableAutoCheck: true,
          enableAnomalyNotification: true
        },
        workspaceSettings: workspaceSettings
      });
      
    } catch (error) {
      console.error('Failed to load attendance settings:', error);
      setError(error.message);
      
      // 設定預設值以防止頁面崩潰
      const workspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      setSettings({
        checkSettings: {
          preCheckWindow: 30,
          postCheckWindow: 60,
          autoCheckInterval: 15,
          lateToleranceMinutes: 10,
          earlyLeaveToleranceMinutes: 10,
          breakTimeToleranceMinutes: 5
        },
        apiSettings: {
          requestTimeout: 30,
          maxRetries: 3,
          retryInterval: 5
        },
        automationSettings: {
          enableAutoCheck: true,
          enableAnomalyNotification: true
        },
        workspaceSettings: [
          {
            id: workspaceId,
            name: `Workspace ${workspaceId}`,
            timezone: 'Asia/Taipei',
            enabled: true
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'check-settings', label: t('attendance.checkSettings'), icon: Clock },
    { id: 'workspace-settings', label: t('attendance.workspaceSettings'), icon: Settings },
    { id: 'test-connection', label: 'Test Connection', icon: TestTube }
  ];

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleWorkspaceToggle = (workspaceId) => {
    setSettings(prev => ({
      ...prev,
      workspaceSettings: prev.workspaceSettings.map(ws =>
        ws.id === workspaceId ? { ...ws, enabled: !ws.enabled } : ws
      )
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const workspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      
      if (!workspaceId) {
        throw new Error('Workspace ID not found. Please login again.');
      }
      
      await apiClient.updateAttendanceSettings(workspaceId, settings);
      
      alert(t('attendance.settingsSaved'));
    } catch (error) {
      console.error('Failed to save attendance settings:', error);
      setError(error.message);
      alert(t('attendance.saveSettingsFailed') + ': ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (workspaceId) => {
    try {
      setTesting(prev => ({ ...prev, [workspaceId]: true }));
      const response = await apiClient.testAttendanceApiConnection(workspaceId);
      setTestResults(prev => ({ 
        ...prev, 
        [workspaceId]: { 
          success: true, 
          message: 'Connection successful',
          timestamp: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [workspaceId]: { 
          success: false, 
          message: error.message,
          timestamp: new Date().toLocaleString()
        }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [workspaceId]: false }));
    }
  };

  const handleCheckMonitoring = async (workspaceId) => {
    try {
      setTesting(prev => ({ ...prev, [`monitor_${workspaceId}`]: true }));
      const response = await apiClient.getAttendanceMonitoring(workspaceId);
      setTestResults(prev => ({ 
        ...prev, 
        [`monitor_${workspaceId}`]: { 
          success: true, 
          message: `Monitoring active: ${response.data?.status || 'Unknown'}`,
          data: response.data,
          timestamp: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [`monitor_${workspaceId}`]: { 
          success: false, 
          message: error.message,
          timestamp: new Date().toLocaleString()
        }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [`monitor_${workspaceId}`]: false }));
    }
  };

  const handleSyncData = async (workspaceId) => {
    try {
      setTesting(prev => ({ ...prev, [`sync_${workspaceId}`]: true }));
      const response = await apiClient.syncAttendanceData(workspaceId);
      setTestResults(prev => ({ 
        ...prev, 
        [`sync_${workspaceId}`]: { 
          success: true, 
          message: 'Data sync completed successfully',
          data: response.data,
          timestamp: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [`sync_${workspaceId}`]: { 
          success: false, 
          message: error.message,
          timestamp: new Date().toLocaleString()
        }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [`sync_${workspaceId}`]: false }));
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
            onClick={loadAttendanceSettings}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Check Settings Tab */}
      {activeTab === 'check-settings' && (
        <div className="space-y-6">
          {/* Check Time Settings */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t('attendance.checkTimeSettings')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('attendance.preCheckWindow')} ({t('attendance.minutes')})
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.checkSettings.preCheckWindow}
                  onChange={(e) => handleSettingChange('checkSettings', 'preCheckWindow', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('attendance.postCheckWindow')} ({t('attendance.minutes')})
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.checkSettings.postCheckWindow}
                  onChange={(e) => handleSettingChange('checkSettings', 'postCheckWindow', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('attendance.autoCheckInterval')} ({t('attendance.minutes')})
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.checkSettings.autoCheckInterval}
                  onChange={(e) => handleSettingChange('checkSettings', 'autoCheckInterval', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Tolerance Settings */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">
              {t('attendance.toleranceSettings')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('attendance.lateTolerance')} ({t('attendance.minutes')})
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.checkSettings.lateToleranceMinutes}
                  onChange={(e) => handleSettingChange('checkSettings', 'lateToleranceMinutes', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('attendance.earlyLeaveTolerance')} ({t('attendance.minutes')})
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.checkSettings.earlyLeaveToleranceMinutes}
                  onChange={(e) => handleSettingChange('checkSettings', 'earlyLeaveToleranceMinutes', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('attendance.breakTimeTolerance')} ({t('attendance.minutes')})
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.checkSettings.breakTimeToleranceMinutes}
                  onChange={(e) => handleSettingChange('checkSettings', 'breakTimeToleranceMinutes', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* API Connection Settings */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              {t('attendance.apiConnectionSettings')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('attendance.requestTimeout')} ({t('attendance.seconds')})
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.apiSettings.requestTimeout}
                  onChange={(e) => handleSettingChange('apiSettings', 'requestTimeout', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('attendance.maxRetries')}
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.apiSettings.maxRetries}
                  onChange={(e) => handleSettingChange('apiSettings', 'maxRetries', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('attendance.retryInterval')} ({t('attendance.seconds')})
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.apiSettings.retryInterval}
                  onChange={(e) => handleSettingChange('apiSettings', 'retryInterval', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Automation Settings */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t('attendance.automationSettings')}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('attendance.enableAutoCheck')}</p>
                  <p className="text-sm text-gray-600">{t('attendance.autoCheckDescription')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('automationSettings', 'enableAutoCheck', !settings.automationSettings.enableAutoCheck)}
                  className="flex items-center"
                >
                  {settings.automationSettings.enableAutoCheck ? (
                    <ToggleRight className="w-8 h-8 text-blue-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('attendance.enableAnomalyNotification')}</p>
                  <p className="text-sm text-gray-600">{t('attendance.anomalyNotificationDescription')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('automationSettings', 'enableAnomalyNotification', !settings.automationSettings.enableAnomalyNotification)}
                  className="flex items-center"
                >
                  {settings.automationSettings.enableAnomalyNotification ? (
                    <ToggleRight className="w-8 h-8 text-blue-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Settings Tab */}
      {activeTab === 'workspace-settings' && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">
            {t('attendance.workspaceManagement')}
          </h3>
          
          <div className="space-y-4">
            {settings.workspaceSettings && settings.workspaceSettings.length > 0 ? (
              settings.workspaceSettings.map((workspace) => (
                <div key={workspace.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{workspace.name}</h4>
                    <p className="text-sm text-gray-600">{t('attendance.timezone')}: {workspace.timezone}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workspace.enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {workspace.enabled ? t('attendance.enabled') : t('attendance.disabled')}
                    </span>
                    
                    <button
                      onClick={() => handleWorkspaceToggle(workspace.id)}
                      className="flex items-center"
                    >
                      {workspace.enabled ? (
                        <ToggleRight className="w-8 h-8 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  {error ? 'Failed to load workspace settings' : 'No workspace settings available'}
                </div>
                <div className="text-sm text-gray-400">
                  API Response: {JSON.stringify(settings.workspaceSettings)}
                </div>
                <button 
                  onClick={loadAttendanceSettings}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Reload Settings
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Connection Tab */}
      {activeTab === 'test-connection' && (
        <div className="space-y-6">
          {settings.workspaceSettings && settings.workspaceSettings.length > 0 ? (
            settings.workspaceSettings.map((workspace) => (
              <div key={workspace.id} className="bg-white p-6 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">{workspace.name}</h4>
                    <p className="text-sm text-gray-600">Workspace ID: {workspace.id}</p>
                    {workspace.brandName && (
                      <p className="text-xs text-gray-500">Brand: {workspace.brandName}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    workspace.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {workspace.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Test Connection */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleTestConnection(workspace.id)}
                      disabled={testing[workspace.id] || !workspace.enabled}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {testing[workspace.id] ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wifi className="w-4 h-4" />
                      )}
                      Test Connection
                    </button>
                    {testResults[workspace.id] && (
                      <div className={`p-2 rounded text-sm ${
                        testResults[workspace.id].success 
                          ? 'bg-green-50 text-green-800' 
                          : 'bg-red-50 text-red-800'
                      }`}>
                        <div className="flex items-center gap-1">
                          {testResults[workspace.id].success ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {testResults[workspace.id].message}
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          {testResults[workspace.id].timestamp}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Check Monitoring */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleCheckMonitoring(workspace.id)}
                      disabled={testing[`monitor_${workspace.id}`] || !workspace.enabled}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {testing[`monitor_${workspace.id}`] ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                      Check Monitoring
                    </button>
                    {testResults[`monitor_${workspace.id}`] && (
                      <div className={`p-2 rounded text-sm ${
                        testResults[`monitor_${workspace.id}`].success 
                          ? 'bg-green-50 text-green-800' 
                          : 'bg-red-50 text-red-800'
                      }`}>
                        <div className="flex items-center gap-1">
                          {testResults[`monitor_${workspace.id}`].success ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {testResults[`monitor_${workspace.id}`].message}
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          {testResults[`monitor_${workspace.id}`].timestamp}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Manual Sync */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleSyncData(workspace.id)}
                      disabled={testing[`sync_${workspace.id}`] || !workspace.enabled}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    >
                      {testing[`sync_${workspace.id}`] ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Manual Sync
                    </button>
                    {testResults[`sync_${workspace.id}`] && (
                      <div className={`p-2 rounded text-sm ${
                        testResults[`sync_${workspace.id}`].success 
                          ? 'bg-green-50 text-green-800' 
                          : 'bg-red-50 text-red-800'
                      }`}>
                        <div className="flex items-center gap-1">
                          {testResults[`sync_${workspace.id}`].success ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {testResults[`sync_${workspace.id}`].message}
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          {testResults[`sync_${workspace.id}`].timestamp}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-lg border">
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  No workspace available for testing
                </div>
                <button 
                  onClick={loadAttendanceSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Reload Workspaces
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Button - Only show for settings tabs */}
      {(activeTab === 'check-settings' || activeTab === 'workspace-settings') && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? t('common.saving') : t('attendance.saveSettings')}
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceSettings;