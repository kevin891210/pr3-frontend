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
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      console.log('Loading brands...');
      const response = await apiClient.getAgentBrands();
      console.log('Brands API response:', response);
      
      const brandsData = response.data || response;
      console.log('Brands data:', brandsData);
      
      if (Array.isArray(brandsData)) {
        // 先顯示所有 brands，不過濾 is_active
        const allBrands = brandsData;
        console.log('All brands:', allBrands);
        
        // 如果有 is_active 欄位，則過濾；否則顯示全部
        const activeBrands = allBrands.filter(brand => 
          brand.is_active === undefined || brand.is_active === true
        );
        console.log('Active brands:', activeBrands);
        
        setBrands(activeBrands);
      } else {
        console.warn('Brands data is not an array:', brandsData);
        setBrands([]);
      }
    } catch (error) {
      console.error('Failed to load brands:', error);
      alert(`載入品牌失敗: ${error.message}`);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.agentLogin({
        email: credentials.username,
        password: credentials.password,
        brand_id: credentials.brandId
      });
      
      // 檢查回應格式
      if (!response || !response.success) {
        throw new Error('Login failed: Invalid response format');
      }
      
      // 檢查必要的回應欄位
      const data = response.data || response;
      const { token, member_id, member_name, brand_id, third_party_token } = data;
      
      if (!token || !member_id || !member_name) {
        throw new Error('Login response missing required fields: token, member_id, member_name');
      }
      
      // 儲存第三方 token
      if (third_party_token) {
        localStorage.setItem('third_party_token', third_party_token);
      }
      
      // 設定 API 客戶端 token
      apiClient.setToken(token);
      
      // 儲存用戶資訊
      login({ 
        member_name: member_name, 
        member_id: member_id, 
        brand_id: brand_id || credentials.brandId
      }, token);
      
      // 登入成功後導向 agent dashboard
      window.location.href = '/agent-dashboard';
    } catch (error) {
      console.error('Agent login error:', error);
      if (error.message.includes('404')) {
        setError('API endpoint not found. Please check backend service.');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('Invalid email, password, or brand selection. Please check your credentials.');
      } else if (error.message.includes('Invalid credentials') || error.message.includes('API 認證失敗')) {
        setError('Account / Password error, Please retry');
      } else {
        setError('Login failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-xl sm:text-2xl">{t('auth.agentLoginPlatform')}</CardTitle>
          <p className="text-sm text-gray-600 mt-2">{t('auth.agentPortal')}</p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <div className="text-red-600 text-sm font-medium">
                  ⚠️ {error}
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              type="email"
              placeholder={t('auth.emailAddress')}
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              className="h-12 text-base"
              required
            />
            <Input
              type="password"
              placeholder={t('common.password')}
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="h-12 text-base"
              required
            />
            <div>
              <select
                className="w-full p-3 border rounded-md text-base h-12"
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
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? t('auth.loggingIn') : t('auth.agentLogin')}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-gray-600 mb-3">{t('auth.systemAdmin')}</p>
            <Button 
              variant="outline" 
              className="w-full h-12 mb-3 text-base"
              onClick={() => window.location.href = '/login'}
            >
              {t('auth.goToAdminLogin')}
            </Button>
            
            {/* Debug 資訊 */}
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left">
              <p className="font-semibold mb-2">Debug Info:</p>
              <div className="space-y-1">
                <p>Brands loaded: <span className="font-medium">{brands.length}</span></p>
                <p>Loading: <span className="font-medium">{loadingBrands ? 'Yes' : 'No'}</span></p>
                <p className="break-all">API Base URL: <span className="font-medium">{window.__APP_CONFIG__?.api?.baseUrl || 'Not set'}</span></p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-3 w-full h-10"
                onClick={loadBrands}
                disabled={loadingBrands}
              >
                重新載入 Brands
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentLoginPage;