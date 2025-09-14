import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/services/api';

const LoginPage = () => {
  const { t } = useTranslation();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await apiClient.login({
        email: credentials.username,
        password: credentials.password
      });
      
      // 設定 API 客戶端 token
      apiClient.setToken(response.token);
      
      // 儲存用戶資訊
      login(response.user, response.token);
      
      // 登入成功後導向 dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      if (error.message.includes('404')) {
        alert('Backend API endpoint not implemented, please check backend service status');
      } else {
        alert('Login failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">HRM Management Platform</CardTitle>
          <p className="text-center text-sm text-gray-600">{t('adminLogin')}</p>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded text-center mb-4">
            Default Admin: admin@hrm.com / admin123
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder={t('email')}
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              required
            />
            <Input
              type="password"
              placeholder={t('password')}
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('loading') : t('adminLogin')}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-gray-600 mb-2">Agent User?</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/agent-login'}
            >
              Go to Agent Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;