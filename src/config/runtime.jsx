export const getConfig = () => {
  return window.__APP_CONFIG__ || { initialized: false };
};

export const isInitialized = () => {
  const config = getConfig();
  return config.initialized === true;
};

export const getApiConfig = () => {
  const config = getConfig();
  return config.api || {};
};

export const buildApiUrl = (path) => {
  const config = getConfig();
  const { baseUrl } = getApiConfig();
  
  // Debug logging
  console.log('buildApiUrl - config:', config);
  console.log('buildApiUrl - baseUrl:', baseUrl);
  console.log('buildApiUrl - path:', path);
  
  if (!baseUrl || baseUrl === '') {
    console.warn('baseUrl is empty, using localhost fallback');
    return `http://127.0.0.1:8000${path}`; // 使用配置中的 baseUrl 作為 fallback
  }
  
  const fullUrl = `${baseUrl.replace(/\/$/, '')}${path}`;
  console.log('buildApiUrl - fullUrl:', fullUrl);
  return fullUrl;
};

// 添加手動重新載入配置的方法
export const reloadConfig = async () => {
  try {
    const response = await fetch('/config/app-config.json?t=' + Date.now(), { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) {
      throw new Error(`Config reload failed: ${response.status}`);
    }
    
    const config = await response.json();
    window.__APP_CONFIG__ = config;
    return config;
  } catch (error) {
    console.error('Failed to reload config:', error);
    throw error;
  }
};