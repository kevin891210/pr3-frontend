import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Settings, Users, TestTube } from 'lucide-react';
import apiClient from '../../services/api';
import { AlertDialog } from '../../components/ui/dialog';

const TelegramPage = () => {
  const [botConfigs, setBotConfigs] = useState([]);
  const [telegramUsers, setTelegramUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertDialog, setAlertDialog] = useState({ open: false, type: 'info', title: '', message: '' });
  const [botForm, setBotForm] = useState({
    bot_token: '',
    bot_name: '',
    workspace_id: ''
  });

  const loadBotConfigs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getTelegramBotConfigs();
      setBotConfigs(response.data || []);
    } catch (error) {
      console.error('Failed to load bot configs:', error);
      setBotConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async (e) => {
    e.preventDefault();
    if (!botForm.bot_token || !botForm.bot_name) {
      setAlertDialog({
        open: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    try {
      await apiClient.createTelegramBot(botForm);
      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Success',
        message: 'Telegram BOT created successfully'
      });
      setBotForm({ bot_token: '', bot_name: '', workspace_id: '' });
      loadBotConfigs();
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Error',
        message: `Failed to create BOT: ${error.message}`
      });
    }
  };

  const handleTestNotification = async (type) => {
    try {
      await apiClient.testTelegramNotification(type, { member_id: 'test' });
      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Test Sent',
        message: `Test ${type} notification sent successfully`
      });
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Test Failed',
        message: `Failed to send test notification: ${error.message}`
      });
    }
  };

  useEffect(() => {
    loadBotConfigs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Telegram Management</h1>
        <p className="text-gray-600">Manage Telegram BOT integration and notifications</p>
      </div>

      <Tabs defaultValue="bots" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bots">BOT Management</TabsTrigger>
          <TabsTrigger value="users">User Status</TabsTrigger>
          <TabsTrigger value="settings">Settings & Test</TabsTrigger>
        </TabsList>

        <TabsContent value="bots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Create New BOT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">BOT Token *</label>
                  <Input
                    type="password"
                    placeholder="123456789:ABCdef..."
                    value={botForm.bot_token}
                    onChange={(e) => setBotForm(prev => ({ ...prev, bot_token: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Get your bot token from @BotFather on Telegram</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">BOT Name *</label>
                  <Input
                    placeholder="HRM BOT"
                    value={botForm.bot_name}
                    onChange={(e) => setBotForm(prev => ({ ...prev, bot_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Workspace ID</label>
                  <Input
                    placeholder="Optional workspace ID"
                    value={botForm.workspace_id}
                    onChange={(e) => setBotForm(prev => ({ ...prev, workspace_id: e.target.value }))}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create BOT
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing BOTs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : botConfigs.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No BOTs configured</div>
              ) : (
                <div className="space-y-3">
                  {botConfigs.map(bot => (
                    <div key={bot.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{bot.bot_name}</div>
                        <div className="text-sm text-gray-500">
                          {bot.workspace_id ? `Workspace: ${bot.workspace_id}` : 'Global BOT'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          bot.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {bot.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Telegram User Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {telegramUsers.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No Telegram users found</div>
              ) : (
                <div className="space-y-3">
                  {telegramUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                          ✅ Telegram Linked
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Test Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Test different types of Telegram notifications</p>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    onClick={() => handleTestNotification('late')}
                  >
                    Test Late Notification
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleTestNotification('salary')}
                  >
                    Test Salary Notification
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleTestNotification('leave')}
                  >
                    Test Leave Notification
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={alertDialog.open}
        onClose={() => setAlertDialog({ open: false, type: 'info', title: '', message: '' })}
        type={alertDialog.type}
        title={alertDialog.title}
        message={alertDialog.message}
      />
    </div>
  );
};

export default TelegramPage;