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
  
  if (!baseUrl || baseUrl === '') {
    return path; // 返回相對路徑，讓 Vite 代理處理
  }
  
  const fullUrl = `${baseUrl.replace(/\/$/, '')}${path}`;
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