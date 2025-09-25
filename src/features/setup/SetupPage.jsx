import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import apiClient from '@/services/api';

const SetupPage = () => {
  const [config, setConfig] = useState({
    baseUrl: '',
    adminEmail: 'admin@hrm.com',
    adminPassword: 'admin123'
  });
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const endpoints = [
    // 基礎服務
    { key: 'health', path: '/health', label: 'Health Check', category: 'core' },
    
    // 認證相關
    { key: 'auth', path: '/api/v1/auth/sign-in', label: 'Admin Authentication', category: 'auth' },
    { key: 'agentAuth', path: '/api/v1/agent-auth/sign-in', label: 'Agent Authentication', category: 'auth' },
    { key: 'adminInit', path: '/api/v1/admin/init', label: 'Admin Initialization', category: 'auth' },
    
    // 使用者與工作區
    { key: 'workspaces', path: '/api/v1/users/workspaces', label: 'User Workspaces', category: 'user' },
    { key: 'members', path: '/api/v1/workspaces/1/members', label: 'Workspace Members', category: 'user' },
    { key: 'users', path: '/api/v1/users', label: 'User Management', category: 'user' },
    
    // Bot 管理
    { key: 'bots', path: '/api/v1/bots/all-bots', label: 'All Bots', category: 'bot' },
    
    // Brand 管理
    { key: 'brands', path: '/api/v1/brands', label: 'Brand Management', category: 'brand' },
    { key: 'monitorBrands', path: '/api/v1/monitor-brands', label: 'Monitor Brands', category: 'brand' },
    { key: 'brandWorkspaces', path: '/api/v1/workspaces-by-brand/1', label: 'Brand Workspaces', category: 'brand' },
    
    // 排班管理
    { key: 'shiftTemplates', path: '/api/v1/shift-templates', label: 'Shift Templates', category: 'schedule' },
    { key: 'scheduleAssignments', path: '/api/v1/schedule-assignments', label: 'Schedule Assignments', category: 'schedule' },
    
    // 請假管理
    { key: 'leaveTypes', path: '/api/v1/leave-types', label: 'Leave Types', category: 'leave' },
    { key: 'leaveRequests', path: '/api/v1/leave-requests', label: 'Leave Requests', category: 'leave' },
    { key: 'leaveBalance', path: '/api/v1/users/1/leave-balance', label: 'Leave Balance', category: 'leave' },
    
    // 公告管理
    { key: 'notices', path: '/api/v1/notices', label: 'Notice Management', category: 'notice' },
    
    // Dashboard
    { key: 'dashboardStats', path: '/api/v1/dashboard/stats', label: 'Dashboard Stats', category: 'dashboard' },
    { key: 'agentMonitor', path: '/api/v1/dashboard/agent-monitor', label: 'Agent Monitor', category: 'dashboard' },
    { key: 'agentMonitorApi', path: '/api/v1/agent-monitor', label: 'Agent Monitor API', category: 'dashboard' },
    
    // 系統管理
    { key: 'systemSettings', path: '/api/v1/system/settings', label: 'System Settings', category: 'system' },
    { key: 'systemStats', path: '/api/v1/system/stats', label: 'System Stats', category: 'system' }
  ];

  const testEndpoint = async (endpoint) => {
    const url = endpoint.key === 'health' 
      ? `${config.baseUrl}/health`
      : `${config.baseUrl}${endpoint.path}`;
      
    try {
      const response = await fetch(url, { 
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      
      // 200-204, 3xx, 401, 403, 405 視為可達
      if (response.status >= 200 && response.status < 300) {
        return { success: true, status: response.status, message: 'OK' };
      }
      if (response.status >= 300 && response.status < 400) {
        return { success: true, status: response.status, message: 'Redirect' };
      }
      if ([401, 403].includes(response.status)) {
        return { success: true, status: response.status, message: 'Auth Required' };
      }
      if (response.status === 405) {
        return { success: true, status: response.status, message: 'Method Not Allowed' };
      }
      if (response.status === 404) {
        return { success: false, status: response.status, message: 'Not Found' };
      }
      
      return { success: false, status: response.status, message: 'Error' };
    } catch (error) {
      return { success: false, error: error.message, message: 'Connection Failed' };
    }
  };

  const handleTestEndpoints = async () => {
    if (!config.baseUrl) return;
    
    setTesting(true);
    const results = {};
    
    // 分批測試以避免過多並發請求
    const batchSize = 5;
    for (let i = 0; i < endpoints.length; i += batchSize) {
      const batch = endpoints.slice(i, i + batchSize);
      const batchPromises = batch.map(async (endpoint) => {
        const result = await testEndpoint(endpoint);
        return { key: endpoint.key, result };
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ key, result }) => {
        results[key] = result;
      });
      
      // 更新部分結果以提供即時反饋
      setTestResults({ ...results });
      
      // 批次間短暫延遲
      if (i + batchSize < endpoints.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const newConfig = {
        initialized: true,
        api: {
          baseUrl: config.baseUrl
        },
        hrm: { enabled: true },
        security: { enforceHttps: false },
        envName: 'SETUP',
        buildVersion: '0.1.0'
      };

      // UAT 環境：Save到 ops 服務
      try {
        const response = await fetch('/__ops/config', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newConfig)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Save配置失敗');
        }
      } catch (e) {
        console.warn('無法Save到 ops 服務，僅Update前端配置');
      }

      // Update前端配置
      window.__APP_CONFIG__ = newConfig;
      
      // 觸發配置Update事件
      window.dispatchEvent(new Event('configUpdated'));
      
      // 等待StatusUpdate後跳轉
      setTimeout(() => {
        navigate('/login');
      }, 100);
      
      // 初始化管理者帳號（背景執行）
      if (config.baseUrl && config.adminEmail && config.adminPassword) {
        setTimeout(async () => {
          try {
            await apiClient.initAdmin({
              email: config.adminEmail,
              password: config.adminPassword
            });
          } catch (e) {
            console.warn('管理者初始化失敗:', e.message);
          }
        }, 100);
      }
    } catch (error) {
      alert('Save Failed: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (result) => {
    if (!result) return null;
    return result.success ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>首次連接設定</CardTitle>
          <p className="text-sm text-muted-foreground">
            設定後端 API 連接資訊並驗證端點可用性
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">API Base URL *</label>
              <Input
                placeholder="https://api.example.com"
                value={config.baseUrl}
                onChange={(e) => setConfig({...config, baseUrl: e.target.value})}
              />
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p className="font-medium mb-2">標準 API 端點將自動配置：</p>
              <ul className="space-y-1 text-xs">
                <li>• 認證：/api/v1/auth/sign-in</li>
                <li>• 工作區：/api/v1/users/workspaces</li>
                <li>• Bot：/api/v1/bots/all-bots</li>
                <li>• 成員：/api/v1/workspaces/:id/members</li>
                <li>• 其他 HRM 相關端點...</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">預設管理者帳號（可選）</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">管理者 Email</label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={config.adminEmail}
                  onChange={(e) => setConfig({...config, adminEmail: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">管理者密碼</label>
                <Input
                  type="password"
                  placeholder="8+ 字元，含大小寫/數字"
                  value={config.adminPassword}
                  onChange={(e) => setConfig({...config, adminPassword: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">端點驗證</h3>
                {Object.keys(testResults).length > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    {Object.values(testResults).filter(r => r.success).length} / {Object.keys(testResults).length} 端點可用
                  </div>
                )}
              </div>
              <Button 
                onClick={handleTestEndpoints} 
                disabled={!config.baseUrl || testing}
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {Object.keys(testResults).length > 0 ? '重新測試' : '測試連接'}
              </Button>
            </div>
            
            <div className="space-y-4">
              {['core', 'auth', 'user', 'bot', 'brand', 'schedule', 'leave', 'notice', 'dashboard', 'system'].map(category => {
                const categoryEndpoints = endpoints.filter(e => e.category === category);
                if (categoryEndpoints.length === 0) return null;
                
                const categoryNames = {
                  core: '核心服務',
                  auth: '認證系統', 
                  user: '使用者管理',
                  bot: 'Bot 管理',
                  brand: 'Brand 管理',
                  schedule: '排班管理',
                  leave: '請假管理', 
                  notice: '公告管理',
                  dashboard: '儀表板',
                  system: '系統管理'
                };
                
                return (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">
                      {categoryNames[category]}
                    </h4>
                    {categoryEndpoints.map(endpoint => (
                      <div key={endpoint.key} className="flex items-center justify-between p-2 border rounded text-sm">
                        <div className="flex-1">
                          <span className="font-medium">{endpoint.label}</span>
                          <div className="text-xs text-gray-500 mt-1">{endpoint.path}</div>
                        </div>
                        <div className="flex items-center gap-2 min-w-[120px] justify-end">
                          {testResults[endpoint.key] && (
                            <span className="text-xs text-muted-foreground">
                              {testResults[endpoint.key].message || testResults[endpoint.key].status || testResults[endpoint.key].error}
                            </span>
                          )}
                          {getStatusIcon(testResults[endpoint.key])}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            {Object.keys(testResults).length > 0 && (
              <div className="text-sm text-gray-600 flex items-center">
                {Object.values(testResults).filter(r => r.success).length === Object.keys(testResults).length ? (
                  <span className="text-green-600 font-medium">✓ 所有端點檢查通過</span>
                ) : (
                  <span className="text-amber-600 font-medium">⚠ 部分端點無法連接</span>
                )}
              </div>
            )}
            <Button 
              onClick={handleSave}
              disabled={!config.baseUrl || saving}
              className="w-full md:w-auto"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save設定
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupPage;