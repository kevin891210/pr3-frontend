import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Database, Shield, Activity, Save } from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';

const SystemPage = () => {
  const { 
    settings, 
    stats, 
    loading, 
    loadSettings, 
    saveSettings, 
    loadStats, 
    createBackup, 
    updateSetting 
  } = useSystemStore();

  useEffect(() => {
    loadStats();
    // 使用本地快取，不強制刷新
    loadSettings(false);
  }, []);



  const handleSaveSettings = async () => {
    try {
      await saveSettings(settings);
      alert('設定已Save');
    } catch (error) {
      if (error.message.includes('API error') || error.message.includes('endpoint not found')) {
        alert('後端 API 尚未實作，設定已暫存於前端');
      } else {
        alert('Save Failed: ' + error.message);
      }
    }
  };

  const handleSettingChange = (key, value) => {
    updateSetting(key, value);
  };

  const handleCreateBackup = async () => {
    try {
      await createBackup();
      alert('系統備份已建立');
    } catch (error) {
      if (error.message.includes('API error') || error.message.includes('endpoint not found')) {
        alert('後端 API 尚未實作備份功能');
      } else {
        alert('備份失敗: ' + error.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">系統管理</h1>
        <p className="text-gray-600">管理系統設定、監控和維護</p>
      </div>

      {/* 系統統計 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">總使用者數</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">活躍使用者</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">系統運行時間</p>
                <p className="text-lg font-bold text-gray-900">{stats.systemUptime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 系統設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            系統設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">一般設定</TabsTrigger>
              <TabsTrigger value="security">安全設定</TabsTrigger>
              <TabsTrigger value="notifications">通知設定</TabsTrigger>
              <TabsTrigger value="maintenance">維護模式</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">網站名稱</label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange('siteName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">預設語言</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={settings.defaultLanguage}
                    onChange={(e) => handleSettingChange('defaultLanguage', e.target.value)}
                  >
                    <option value="zh-TW">繁體中文</option>
                    <option value="zh-CN">簡體中文</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">時區</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  >
                    <option value="Asia/Taipei">Asia/Taipei</option>
                    <option value="Asia/Shanghai">Asia/Shanghai</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="debugMode"
                    checked={settings.debugMode}
                    onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                  />
                  <label htmlFor="debugMode" className="text-sm font-medium">除錯模式</label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">最大登入嘗試次數</label>
                  <Input
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">會話超時 (小時)</label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
                <label htmlFor="emailNotifications" className="text-sm font-medium">Active Email 通知</label>
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                />
                <label htmlFor="maintenanceMode" className="text-sm font-medium">維護模式</label>
              </div>
              <p className="text-sm text-gray-600">Active維護模式後，只有管理員可以訪問系統</p>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6 space-x-2">
            <Button 
              variant="outline"
              onClick={() => loadSettings(true)}
              disabled={loading}
            >
              從後端刷新
            </Button>
            <Button 
              onClick={handleSaveSettings} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Save中...' : 'Save設定'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 系統監控 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>系統資源</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>磁碟使用率</span>
                <span>{stats.diskUsage}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: stats.diskUsage}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>記憶體使用率</span>
                <span>{stats.memoryUsage}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: stats.memoryUsage}}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>備份資訊</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">最後備份時間:</span> {stats.lastBackup}</p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleCreateBackup}
              >
                立即備份
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemPage;