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
  console.log('Current config:', config);
  console.log('API baseUrl:', baseUrl);
  if (!baseUrl) {
    console.warn('No API baseUrl configured');
    return '';
  }
  const fullUrl = `${baseUrl.replace(/\/$/, '')}${path}`;
  console.log('Built API URL:', fullUrl);
  return fullUrl;
};