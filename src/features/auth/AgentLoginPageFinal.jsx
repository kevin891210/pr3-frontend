import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/services/api';
import { User, Lock, Building2, LogIn, Settings, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './AgentLogin.module.css';

const AgentLoginPageFinal = () => {
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
  const [loginSuccess, setLoginSuccess] = useState(false);
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
    
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
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
      
      // 顯示成功狀態
      setLoginSuccess(true);
      
      // 延遲跳轉以顯示成功動畫
      setTimeout(() => {
        window.location.href = '/agent-dashboard';
      }, 1500);
      
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

  if (loginSuccess) {
    return (
      <div className={styles.loginContainer}>
        <div className="flex items-center justify-center min-h-screen">
          <div className={`${styles.loginCard} rounded-2xl p-8 text-center`}>
            <div className={styles.successMessage}>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">登入成功！</h2>
              <p className="text-gray-600">正在跳轉到您的工作台...</p>
              <div className="mt-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginContainer}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Logo 和標題區域 */}
          <div className={`${styles.logoContainer} text-center mb-8`}>
            <div className={`${styles.logoIcon} inline-flex items-center justify-center w-16 h-16 rounded-full mb-4`}>
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
              {t('auth.agentLoginPlatform')}
            </h1>
            <p className="text-white/80 text-lg drop-shadow">
              {t('auth.agentPortal')}
            </p>
          </div>

          {/* 登入卡片 */}
          <Card className={`${styles.loginCard} border-0 rounded-2xl overflow-hidden`}>
            <CardContent className="p-8">
              {/* 錯誤訊息 */}
              {error && (
                <div className={`${styles.errorMessage} mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3`}>
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-red-700 text-sm font-medium">
                    {error}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleLogin} className="space-y-6">
                {/* 電子郵件輸入 */}
                <div className={`${styles.inputGroup} space-y-2`}>
                  <label className="text-sm font-semibold text-gray-700">
                    {t('auth.emailAddress')}
                  </label>
                  <div className="relative">
                    <User className={`${styles.inputIcon} absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400`} />
                    <Input
                      type="email"
                      placeholder="請輸入您的電子郵件地址"
                      value={credentials.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`${styles.inputField} pl-10 h-12 text-base rounded-xl border-2 transition-all duration-200 ${
                        validationErrors.username 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
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
                <div className={`${styles.inputGroup} space-y-2`}>
                  <label className="text-sm font-semibold text-gray-700">
                    {t('common.password')}
                  </label>
                  <div className="relative">
                    <Lock className={`${styles.inputIcon} absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400`} />
                    <Input
                      type="password"
                      placeholder="請輸入您的密碼"
                      value={credentials.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`${styles.inputField} pl-10 h-12 text-base rounded-xl border-2 transition-all duration-200 ${
                        validationErrors.password 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
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
                <div className={`${styles.inputGroup} space-y-2`}>
                  <label className="text-sm font-semibold text-gray-700">
                    {t('auth.selectBrand')}
                  </label>
                  <div className="relative">
                    <Building2 className={`${styles.inputIcon} absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10`} />
                    <select
                      className={`${styles.inputField} w-full pl-10 pr-4 py-3 border-2 rounded-xl text-base h-12 bg-white appearance-none transition-all duration-200 ${
                        validationErrors.brandId 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
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
                      <Loader2 className={`${styles.loadingSpinner} absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400`} />
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
                  className={`${styles.loginButton} w-full h-12 text-base font-semibold rounded-xl shadow-lg`}
                  disabled={loading || loadingBrands}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className={`${styles.loadingSpinner} w-5 h-5`} />
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
          <div className={`${styles.adminSection} mt-8 text-center rounded-2xl p-6 border`}>
            <p className="text-sm text-white/80 mb-4">
              {t('auth.systemAdmin')}
            </p>
            <Button 
              variant="outline" 
              className="w-full h-12 text-base font-medium border-white/30 text-white hover:bg-white/10 transition-all duration-200 rounded-xl"
              onClick={() => window.location.href = '/login'}
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>{t('auth.goToAdminLogin')}</span>
              </div>
            </Button>
          </div>

          {/* Debug 資訊 (開發環境) */}
          {process.env.NODE_ENV === 'development' && (
            <div className={`${styles.debugSection} mt-6 rounded-xl p-4`}>
              <details className="text-xs">
                <summary className="font-semibold cursor-pointer mb-2 text-white/80">Debug Info</summary>
                <div className="space-y-1 text-white/60">
                  <p>Brands loaded: <span className="font-medium">{brands.length}</span></p>
                  <p>Loading: <span className="font-medium">{loadingBrands ? 'Yes' : 'No'}</span></p>
                  <p className="break-all">API Base URL: <span className="font-medium">{window.__APP_CONFIG__?.api?.baseUrl || 'Not set'}</span></p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-3 w-full h-8 text-xs border-white/30 text-white/80 hover:bg-white/10"
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
    </div>
  );
};

export default AgentLoginPageFinal;