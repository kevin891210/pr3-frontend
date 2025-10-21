import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/services/api';
import { User, Lock, Building2, LogIn, Settings, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const AgentLoginPageRedesigned = () => {
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
  const [validationErrors, setValidationErrors] = useState({});
  const { login } = useAuthStore();

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoadingBrands(true);
      const response = await apiClient.getAgentBrands();
      const brandsData = response.data || response;
      
      if (Array.isArray(brandsData)) {
        const activeBrands = brandsData.filter(brand => 
          brand.is_active === undefined || brand.is_active === true
        );
        setBrands(activeBrands);
      } else {
        setBrands([]);
      }
    } catch (error) {
      console.error('Failed to load agent brands:', error);
      setError(`載入品牌失敗: ${error.message}`);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!credentials.username) {
      errors.username = '請輸入電子郵件地址';
    } else if (!/\S+@\S+\.\S+/.test(credentials.username)) {
      errors.username = '請輸入有效的電子郵件地址';
    }
    
    if (!credentials.password) {
      errors.password = '請輸入密碼';
    } else if (credentials.password.length < 6) {
      errors.password = '密碼至少需要6個字符';
    }
    
    if (!credentials.brandId) {
      errors.brandId = '請選擇品牌';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    // 清除該欄位的驗證錯誤
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // 清除一般錯誤
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.agentLogin({
        email: credentials.username,
        password: credentials.password,
        brand_id: credentials.brandId
      });
      
      if (!response || !response.success) {
        throw new Error('Login failed: Invalid response format');
      }
      
      const data = response.data || response;
      const { token, member_id, member_name, brand_id, third_party_token } = data;
      
      if (!token || !member_id || !member_name) {
        throw new Error('Login response missing required fields');
      }
      
      if (third_party_token) {
        localStorage.setItem('third_party_token', third_party_token);
      }
      
      apiClient.setToken(token);
      
      login({ 
        member_name: member_name, 
        member_id: member_id, 
        brand_id: brand_id || credentials.brandId
      }, token);
      
      // 成功動畫後跳轉
      setTimeout(() => {
        window.location.href = '/agent-dashboard';
      }, 1000);
      
    } catch (error) {
      console.error('Agent login error:', error);
      
      if (error.message.includes('404')) {
        setError('API 端點未找到，請檢查後端服務');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('帳號、密碼或品牌選擇錯誤，請檢查您的登入資訊');
      } else if (error.message.includes('Invalid credentials')) {
        setError('帳號或密碼錯誤，請重新輸入');
      } else {
        setError('登入失敗：' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo 和標題區域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.agentLoginPlatform')}
          </h1>
          <p className="text-gray-600">
            {t('auth.agentPortal')}
          </p>
        </div>

        {/* 登入卡片 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* 錯誤訊息 */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-red-700 text-sm font-medium">
                  {error}
                </div>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-6">
              {/* 電子郵件輸入 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {t('auth.emailAddress')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="請輸入您的電子郵件地址"
                    value={credentials.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={`pl-10 h-12 text-base transition-all duration-200 ${
                      validationErrors.username 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    }`}
                    required
                  />
                </div>
                {validationErrors.username && (
                  <p className="text-red-500 text-sm flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validationErrors.username}</span>
                  </p>
                )}
              </div>

              {/* 密碼輸入 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {t('common.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="請輸入您的密碼"
                    value={credentials.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 h-12 text-base transition-all duration-200 ${
                      validationErrors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    }`}
                    required
                  />
                </div>
                {validationErrors.password && (
                  <p className="text-red-500 text-sm flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validationErrors.password}</span>
                  </p>
                )}
              </div>

              {/* 品牌選擇 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {t('auth.selectBrand')}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <select
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg text-base h-12 bg-white appearance-none transition-all duration-200 ${
                      validationErrors.brandId 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    } ${loadingBrands ? 'opacity-50' : ''}`}
                    value={credentials.brandId}
                    onChange={(e) => handleInputChange('brandId', e.target.value)}
                    required
                    disabled={loadingBrands}
                  >
                    <option value="">
                      {loadingBrands ? '載入中...' : '請選擇品牌'}
                    </option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                        {brand.description && ` - ${brand.description}`}
                      </option>
                    ))}
                  </select>
                  {loadingBrands && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                  )}
                </div>
                {validationErrors.brandId && (
                  <p className="text-red-500 text-sm flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validationErrors.brandId}</span>
                  </p>
                )}
              </div>

              {/* 登入按鈕 */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={loading || loadingBrands}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('auth.loggingIn')}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LogIn className="w-5 h-5" />
                    <span>{t('auth.agentLogin')}</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 管理員登入連結 */}
        <div className="mt-8 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-4">
              {t('auth.systemAdmin')}
            </p>
            <Button 
              variant="outline" 
              className="w-full h-12 text-base font-medium border-gray-300 hover:border-gray-400 transition-all duration-200"
              onClick={() => window.location.href = '/login'}
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>{t('auth.goToAdminLogin')}</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Debug 資訊 (開發環境) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-gray-100 rounded-lg p-4">
            <details className="text-xs">
              <summary className="font-semibold cursor-pointer mb-2">Debug Info</summary>
              <div className="space-y-1 text-gray-600">
                <p>Brands loaded: <span className="font-medium">{brands.length}</span></p>
                <p>Loading: <span className="font-medium">{loadingBrands ? 'Yes' : 'No'}</span></p>
                <p className="break-all">API Base URL: <span className="font-medium">{window.__APP_CONFIG__?.api?.baseUrl || 'Not set'}</span></p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-3 w-full h-8 text-xs"
                onClick={loadBrands}
                disabled={loadingBrands}
              >
                重新載入 Brands
              </Button>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentLoginPageRedesigned;