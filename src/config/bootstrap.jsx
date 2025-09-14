// Runtime config bootstrap
export async function loadAppConfig() {
  try {
    const response = await fetch('/config/app-config.json', { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) {
      throw new Error(`Config load failed: ${response.status}`);
    }
    
    const config = await response.json();
    window.__APP_CONFIG__ = config;
    
    return config;
  } catch (error) {
    console.error('Failed to load app config:', error);
    // Fallback config for development
    const fallbackConfig = {
      initialized: false,
      api: { baseUrl: '' },
      hrm: { enabled: true },
      security: { enforceHttps: false },
      envName: 'FALLBACK',
      buildVersion: '0.0.0'
    };
    window.__APP_CONFIG__ = fallbackConfig;
    return fallbackConfig;
  }
}

export function getConfig() {
  return window.__APP_CONFIG__ || { initialized: false };
}

export function isInitialized() {
  const config = getConfig();
  return config.initialized === true;
}

export function getApiConfig() {
  const config = getConfig();
  return config.api || {};
}

export function buildApiUrl(path) {
  const { baseUrl } = getApiConfig();
  if (!baseUrl) return '';
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}