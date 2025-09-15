import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/services/api';

const AgentLoginPage = () => {
  const { t } = useTranslation();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    brandId: ''
  });
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const { login } = useAuthStore();

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const response = await apiClient.getBrands();
      const brandsData = response.data || response;
      setBrands(Array.isArray(brandsData) ? brandsData.filter(brand => brand.is_active) : []);
    } catch (error) {
      console.error('Failed to load brands:', error);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await apiClient.agentLogin({
        email: credentials.username,
        password: credentials.password,
        brand_id: credentials.brandId
      });
      
      // 處理 API 響應結構（可能是 { data: { user, token } } 或 { user, token }）
      const userData = response.data?.user || response.user || {};
      const token = response.data?.token || response.token;
      
      if (!token) {
        throw new Error('No authentication token received');
      }
      
      // 設定 API 客戶端 token
      apiClient.setToken(token);
      
      // 儲存用戶資訊
      login(userData, token);
      
      // 登入成功後導向 agent dashboard
      window.location.href = '/agent-dashboard';
    } catch (error) {
      if (error.message.includes('404')) {
        alert(t('auth.apiNotImplemented'));
      } else {
        alert(t('auth.loginFailed') + ': ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{t('auth.agentLoginPlatform')}</CardTitle>
          <p className="text-center text-sm text-gray-600">{t('auth.agentPortal')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder={t('auth.emailAddress')}
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              required
            />
            <Input
              type="password"
              placeholder={t('common.password')}
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              required
            />
            <div>
              <select
                className="w-full p-2 border rounded-md"
                value={credentials.brandId}
                onChange={(e) => setCredentials({...credentials, brandId: e.target.value})}
                required
                disabled={loadingBrands}
              >
                <option value="">{loadingBrands ? t('common.loading') : t('auth.selectBrand')}</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.loggingIn') : t('auth.agentLogin')}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-gray-600 mb-2">{t('auth.systemAdmin')}</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/login'}
            >
              {t('auth.goToAdminLogin')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentLoginPage;