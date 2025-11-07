import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { APP_CREDENTIALS } from '../config/appCredentials';
import { ENV, STORAGE_KEYS } from '../config/env';

const API_URL = ENV.API_URL;
const APP_TOKEN_KEY = STORAGE_KEYS.APP_TOKEN;
const USER_TOKEN_KEY = STORAGE_KEYS.USER_TOKEN;
const REFRESH_TOKEN_KEY = STORAGE_KEYS.REFRESH_TOKEN;

let appAuthPromise: Promise<string> | null = null;
let refreshTokenPromise: Promise<boolean> | null = null;

async function authenticateApp(forceNew: boolean = false): Promise<string> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;

  if (!forceNew) {
    const savedToken = await AsyncStorage.getItem(APP_TOKEN_KEY);
    if (savedToken) {
      return savedToken;
    }
  }

  if (forceNew) {
    await AsyncStorage.removeItem(APP_TOKEN_KEY);
  }

  const authUrl = `${API_URL}auth/AppLogin`;

  try {
    const response = await axios.post(authUrl, {
      appId: APP_CREDENTIALS.appId,
      appSecret: APP_CREDENTIALS.appSecret,
    });

    if (response.data?.status && response.data?.dados?.token) {
      const token = typeof response.data.dados.token === 'string'
        ? response.data.dados.token
        : response.data.dados.token.token;

      await AsyncStorage.setItem(APP_TOKEN_KEY, token);
      return token;
    }

    throw new Error('Falha na autenticação do aplicativo');
  } catch (error: any) {
    console.error('❌ Erro ao autenticar app:', error.message);
    console.error('📍 URL tentada:', authUrl);
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
    }
    throw error;
  }
}

async function refreshUserToken(): Promise<boolean> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;

  try {
    const userToken = await AsyncStorage.getItem(USER_TOKEN_KEY);
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

    if (!userToken || !refreshToken) {
      return false;
    }

    await AsyncStorage.removeItem(APP_TOKEN_KEY);
    appAuthPromise = null;
    appAuthPromise = authenticateApp(true);
    const appToken = await appAuthPromise;

    const response = await axios.post(`${API_URL}auth/RefreshToken`, {
      AccessToken: userToken,
      RefreshToken: refreshToken,
    }, {
      headers: {
        'Authorization': `Bearer ${appToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data?.status && response.data?.dados) {
      const { token: tokenObj, refreshToken: newRefreshToken } = response.data.dados;
      const newToken = typeof tokenObj === 'string' ? tokenObj : tokenObj.token;

      await AsyncStorage.setItem(USER_TOKEN_KEY, newToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

      return true;
    }

    return false;
  } catch (error: any) {
    console.error('❌ Erro ao renovar token:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    await AsyncStorage.removeItem(USER_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    return false;
  }
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;

      if (!config.url?.includes('AppLogin')) {
        if (!appAuthPromise) {
          appAuthPromise = authenticateApp();
        }

        try {
          await appAuthPromise;
        } catch (error) {
          console.error('❌ Erro ao autenticar app:', error);
          appAuthPromise = null;
          throw error;
        }
      }

      const userToken = await AsyncStorage.getItem(USER_TOKEN_KEY);
      if (userToken) {
        try {
          const tokenData = JSON.parse(atob(userToken.split('.')[1]));
          const expirationTime = tokenData.exp * 1000;
          const isExpired = Date.now() >= expirationTime - 60000;

          if (isExpired && !config.url?.includes('auth/RefreshToken')) {

            if (!refreshTokenPromise) {
              refreshTokenPromise = refreshUserToken();
            }

            const success = await refreshTokenPromise;
            refreshTokenPromise = null;

            if (success) {
              const newUserToken = await AsyncStorage.getItem(USER_TOKEN_KEY);
              config.headers.Authorization = `Bearer ${newUserToken}`;
            }
          } else {
            config.headers.Authorization = `Bearer ${userToken}`;
          }
        } catch (tokenError) {
          config.headers.Authorization = `Bearer ${userToken}`;
        }
      } else {
        const appToken = await AsyncStorage.getItem(APP_TOKEN_KEY);
        if (appToken) {
          config.headers.Authorization = `Bearer ${appToken}`;
          if (config.url && !config.url.includes('auth/')) {
            console.warn('⚠️ Acessando endpoint protegido sem token de usuário:', config.url);
          }
        }
      }
    } catch (error) {
      console.error('[Token Error]', error);
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {

      switch (error.response.status) {
        case 401:
        case 403:
          const isTokenExpired = error.response.headers?.['www-authenticate']?.includes('expired') ||
            error.response.headers?.['www-authenticate']?.includes('invalid_token');

          if (error.config.url?.includes('auth/login') && isTokenExpired && !originalRequest._retry) {
            try {
              originalRequest._retry = true;

              const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
              await AsyncStorage.removeItem(APP_TOKEN_KEY);
              appAuthPromise = null;

              appAuthPromise = authenticateApp(true);
              const newToken = await appAuthPromise;

              error.config.headers.Authorization = `Bearer ${newToken}`;

              return axiosInstance.request(error.config);
            } catch (e) {
              console.error('❌ Falha ao renovar token do app:', e);
            }
          }

          if (!error.config.url?.includes('AppLogin') &&
            !error.config.url?.includes('auth/login') &&
            !error.config.url?.includes('auth/RefreshToken') &&
            !originalRequest._retry) {
            try {
              const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
              const userToken = await AsyncStorage.getItem(USER_TOKEN_KEY);

              if (userToken) {
                originalRequest._retry = true;

                if (!refreshTokenPromise) {
                  refreshTokenPromise = refreshUserToken();
                }

                const success = await refreshTokenPromise;
                refreshTokenPromise = null;

                if (success) {
                  const newUserToken = await AsyncStorage.getItem(USER_TOKEN_KEY);
                  error.config.headers.Authorization = `Bearer ${newUserToken}`;
                  return axiosInstance.request(error.config);
                }
              } else {
                originalRequest._retry = true;

                await AsyncStorage.removeItem(APP_TOKEN_KEY);
                appAuthPromise = null;

                appAuthPromise = authenticateApp(true);
                const newToken = await appAuthPromise;

                error.config.headers.Authorization = `Bearer ${newToken}`;

                return axiosInstance.request(error.config);
              }
            } catch (e) {
              console.error('❌ Falha ao renovar token:', e);
            }
          }
          break;
        case 404:
          if (!originalRequest._retry) {
            console.log('❌ Recurso não encontrado');
          }
          break;
      }
    } else if (error.request) {
      console.error('[API Network Error]', error.message);
    } else {
      console.error('[API Error]', error.message);
    }

    return Promise.reject(error);
  }
);

export const api = {
  get: async <T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<T> = await axiosInstance.get(endpoint, config);
    return response.data;
  },

  post: async <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<T> = await axiosInstance.post(endpoint, data, config);
    return response.data;
  },

  put: async <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<T> = await axiosInstance.put(endpoint, data, config);
    return response.data;
  },

  patch: async <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<T> = await axiosInstance.patch(endpoint, data, config);
    return response.data;
  },

  delete: async <T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<T> = await axiosInstance.delete(endpoint, config);
    return response.data;
  },

  clearAppToken: async (): Promise<void> => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem(APP_TOKEN_KEY);
      appAuthPromise = null;
    } catch (error) {
      console.error('❌ Erro ao limpar token do app:', error);
    }
  },

  renewAppToken: async (): Promise<void> => {
    try {
      await api.clearAppToken();
      appAuthPromise = authenticateApp(true);
      await appAuthPromise;
    } catch (error) {
      console.error('❌ Erro ao renovar token do app:', error);
      throw error;
    }
  },
};

export { axiosInstance, refreshUserToken };

export default api;
