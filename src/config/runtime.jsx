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
  const { baseUrl } = getApiConfig();
  if (!baseUrl) return '';
  return `${baseUrl.replace(/\/$/, '')}${path}`;
};