import {
  API_URL,
  APP_ID,
  APP_SECRET,
  APP_NAME,
  APP_VERSION,
  NODE_ENV,
  STORAGE_PREFIX,
  ENABLE_DEBUG,
  ENABLE_API_LOGS,
  ENABLE_MOCK_DATA,
  API_TIMEOUT,
  TOKEN_EXPIRATION,
  TERMS_URL,
  PRIVACY_URL,
  SUPPORT_URL,
  SUPPORT_EMAIL,
} from '@env';

const normalizeApiUrl = (url: string): string => {
  if (!url) return 'https://ecobinapi.runasp.net/api/';
  return url.endsWith('/') ? url : `${url}/`;
};

export const ENV = {
  API_URL: normalizeApiUrl(API_URL || 'https://ecobinapi.runasp.net/api'),
  
  APP_ID: APP_ID || 'ecobin-mobile-app-2025',
  APP_SECRET: APP_SECRET || 'GrupoBioCodeFacens',
  
  APP_NAME: APP_NAME || 'EcoBin',
  APP_VERSION: APP_VERSION || '1.0.0',
  NODE_ENV: NODE_ENV || 'production',
  
  STORAGE_PREFIX: STORAGE_PREFIX || '@ecobin',
  
  ENABLE_DEBUG: ENABLE_DEBUG === 'true',
  ENABLE_API_LOGS: ENABLE_API_LOGS === 'true',
  ENABLE_MOCK_DATA: ENABLE_MOCK_DATA === 'true',
  
  API_TIMEOUT: parseInt(API_TIMEOUT || '30000', 10),
  TOKEN_EXPIRATION: parseInt(TOKEN_EXPIRATION || '3600000', 10),
  
  TERMS_URL: TERMS_URL || '',
  PRIVACY_URL: PRIVACY_URL || '',
  SUPPORT_URL: SUPPORT_URL || '',
  SUPPORT_EMAIL: SUPPORT_EMAIL || '',
  
  isDevelopment: () => NODE_ENV === 'development',
  isProduction: () => NODE_ENV === 'production',
  isDebugEnabled: () => ENABLE_DEBUG === 'true',
};

export const STORAGE_KEYS = {
  APP_TOKEN: `${ENV.STORAGE_PREFIX}:appToken`,
  USER_TOKEN: `${ENV.STORAGE_PREFIX}:token`,
  REFRESH_TOKEN: `${ENV.STORAGE_PREFIX}:refreshToken`,
  USER_DATA: `${ENV.STORAGE_PREFIX}:userData`,
};
