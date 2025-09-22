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
      // 登入 API 調用
      const response = await apiClient.login({
        email: credentials.username,
        password: credentials.password
      });
      
      if (response.success) {
        // 新格式：data 直接是 JWT token
        const token = response.data;
        
        // 設定 token 到 API 客戶端
        apiClient.setToken(token);
        
        // 創建預設用戶資訊（因為 /users/me 端點不存在）
        const userData = {
          id: 'admin',
          email: credentials.username,
          name: 'Administrator',
          role: 'Owner'
        };
        
        // 儲存用戶資訊和 token
        login(userData, token);
        
        // 登入成功後導向 dashboard
        window.location.href = '/dashboard';
      } else {
        throw new Error(response.message || '登入失敗');
      }
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
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="kevinchc@me.com"
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