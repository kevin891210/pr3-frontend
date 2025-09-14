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
    authPath: '/api/v1/auth/sign-in',
    workspacesPath: '/api/v1/users/workspaces',
    botsPath: '/api/v1/bots/all-bots',
    membersPath: '/api/v1/workspaces/:id/members',
    adminEmail: 'admin@hrm.com',
    adminPassword: 'admin123'
  });
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const endpoints = [
    { key: 'health', path: '/health', label: 'Health Check' },
    { key: 'auth', path: 'authPath', label: 'Authentication' },
    { key: 'workspaces', path: 'workspacesPath', label: 'Workspaces' },
    { key: 'bots', path: 'botsPath', label: 'Bots' },
    { key: 'members', path: 'membersPath', label: 'Members' }
  ];

  const testEndpoint = async (url) => {
    try {
      const response = await fetch(url, { 
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      
      // 200-204, 3xx, 401, 403, 405 視為可達
      if (response.status >= 200 && response.status < 300) return { success: true, status: response.status };
      if (response.status >= 300 && response.status < 400) return { success: true, status: response.status };
      if ([401, 403, 405].includes(response.status)) return { success: true, status: response.status };
      if (response.status === 404) return { success: true, status: response.status, note: 'Route exists' };
      
      return { success: false, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleTestEndpoints = async () => {
    if (!config.baseUrl) return;
    
    setTesting(true);
    const results = {};
    
    for (const endpoint of endpoints) {
      const url = endpoint.key === 'health' 
        ? `${config.baseUrl}/health`
        : `${config.baseUrl}${config[endpoint.path]}`;
      
      results[endpoint.key] = await testEndpoint(url);
    }
    
    setTestResults(results);
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const newConfig = {
        initialized: true,
        api: {
          baseUrl: config.baseUrl,
          authPath: config.authPath,
          workspacesPath: config.workspacesPath,
          botsPath: config.botsPath,
          membersPath: config.membersPath
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
      
      console.log('配置已Save，準備跳轉');
      
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
            console.log('管理者帳號初始化成功');
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Auth Path</label>
                <Input
                  value={config.authPath}
                  onChange={(e) => setConfig({...config, authPath: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Workspaces Path</label>
                <Input
                  value={config.workspacesPath}
                  onChange={(e) => setConfig({...config, workspacesPath: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bots Path</label>
                <Input
                  value={config.botsPath}
                  onChange={(e) => setConfig({...config, botsPath: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Members Path</label>
                <Input
                  value={config.membersPath}
                  onChange={(e) => setConfig({...config, membersPath: e.target.value})}
                />
              </div>
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
              <h3 className="text-lg font-medium">端點驗證</h3>
              <Button 
                onClick={handleTestEndpoints} 
                disabled={!config.baseUrl || testing}
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                測試連接
              </Button>
            </div>
            
            <div className="space-y-2">
              {endpoints.map(endpoint => (
                <div key={endpoint.key} className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">{endpoint.label}</span>
                  <div className="flex items-center gap-2">
                    {testResults[endpoint.key] && (
                      <span className="text-sm text-muted-foreground">
                        {testResults[endpoint.key].status || testResults[endpoint.key].error}
                      </span>
                    )}
                    {getStatusIcon(testResults[endpoint.key])}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4">
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