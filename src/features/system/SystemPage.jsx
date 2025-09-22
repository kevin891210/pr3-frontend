import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Database, Shield, Activity, Save } from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';

const SystemPage = () => {
  const { t, i18n } = useTranslation();
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
    // Skip API calls to avoid CORS errors - use mock data
  }, []);



  const handleSaveSettings = async () => {
    try {
      await saveSettings(settings);
      alert(t('system.settings.settingsSaved'));
    } catch (error) {
      if (error.message.includes('API error') || error.message.includes('endpoint not found')) {
        alert(t('system.settings.backendNotImplemented'));
      } else {
        alert(t('system.settings.saveFailed') + ': ' + error.message);
      }
    }
  };

  const handleSettingChange = (key, value) => {
    updateSetting(key, value);
  };

  const handleCreateBackup = async () => {
    try {
      await createBackup();
      alert(t('system.monitoring.backupCreated'));
    } catch (error) {
      if (error.message.includes('API error') || error.message.includes('endpoint not found')) {
        alert(t('system.monitoring.backupNotImplemented'));
      } else {
        alert(t('system.monitoring.backupFailed') + ': ' + error.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Management</h1>
        <p className="text-gray-600">Manage system settings, monitoring and maintenance</p>
      </div>

      {/* 系統統計 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                <p className="text-lg font-bold text-gray-900">{stats.systemUptime || 'Unknown'}</p>
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
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General Settings</TabsTrigger>
              <TabsTrigger value="security">Security Settings</TabsTrigger>
              <TabsTrigger value="notifications">Notification Settings</TabsTrigger>
              <TabsTrigger value="telegram">Telegram BOT</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance Mode</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Site Name</label>
                  <Input
                    value={settings.siteName || ''}
                    onChange={(e) => handleSettingChange('siteName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Default Language</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={settings.defaultLanguage || 'zh'}
                    onChange={(e) => handleSettingChange('defaultLanguage', e.target.value)}
                  >
                    <option value="zh">繁體中文</option>
                    <option value="zh-CN">簡體中文</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Timezone</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={settings.timezone || 'Asia/Taipei'}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  >
                    <option value="Asia/Taipei">Asia/Taipei</option>
                    <option value="Asia/Shanghai">Asia/Shanghai</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="debugMode"
                    checked={settings.debugMode || false}
                    onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                  />
                  <label htmlFor="debugMode" className="text-sm font-medium">Debug Mode</label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Login Attempts</label>
                  <Input
                    type="number"
                    value={settings.maxLoginAttempts || 5}
                    onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Session Timeout (hours)</label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout || 24}
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
                  checked={settings.emailNotifications || false}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
                <label htmlFor="emailNotifications" className="text-sm font-medium">Enable Email Notifications</label>
              </div>
            </TabsContent>

            <TabsContent value="telegram" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium">Telegram BOT Auth Token</label>
                  <Input
                    type="password"
                    placeholder="Enter Telegram BOT Auth Token"
                    value={settings.telegramBotToken || ''}
                    onChange={(e) => handleSettingChange('telegramBotToken', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Get your bot token from @BotFather on Telegram</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Telegram BOT Name</label>
                  <Input
                    placeholder="Enter Telegram BOT Name"
                    value={settings.telegramBotName || ''}
                    onChange={(e) => handleSettingChange('telegramBotName', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Display name for your Telegram bot</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="telegramBotEnabled"
                    checked={settings.telegramBotEnabled || false}
                    onChange={(e) => handleSettingChange('telegramBotEnabled', e.target.checked)}
                  />
                  <label htmlFor="telegramBotEnabled" className="text-sm font-medium">Enable Telegram BOT</label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.maintenanceMode || false}
                  onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                />
                <label htmlFor="maintenanceMode" className="text-sm font-medium">Maintenance Mode</label>
              </div>
              <p className="text-sm text-gray-600">When maintenance mode is enabled, only administrators can access the system</p>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6 space-x-2">
            <Button 
              variant="outline"
              onClick={() => loadSettings(true)}
              disabled={loading}
            >
              Refresh from Backend
            </Button>
            <Button 
              onClick={handleSaveSettings} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 系統監控 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Disk Usage</span>
                <span>{stats.diskUsage || '0%'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: stats.diskUsage}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span>{stats.memoryUsage || '0%'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: stats.memoryUsage}}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">Last Backup:</span> {stats.lastBackup || 'Unknown'}</p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleCreateBackup}
                disabled={loading}
              >
                Create Backup Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemPage;