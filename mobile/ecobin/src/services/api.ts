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
      console.log('⚠️ Tokens ausentes, não é possível renovar');
      return false;
    }

    // Garante que temos um token de app válido antes de tentar refresh
    await AsyncStorage.removeItem(APP_TOKEN_KEY);
    appAuthPromise = null;
    appAuthPromise = authenticateApp(true);
    const appToken = await appAuthPromise;

    console.log('🔄 Tentando renovar token de usuário...');

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

      console.log('✅ Token renovado com sucesso');
      return true;
    }

    console.log('❌ Resposta inválida ao renovar token');
    return false;
  } catch (error: any) {
    console.error('❌ Erro ao renovar token:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Limpa os tokens inválidos
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

      // Sempre garante token do app para endpoints não-AppLogin
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

      // Verifica se há token de usuário e se está válido
      const userToken = await AsyncStorage.getItem(USER_TOKEN_KEY);
      if (userToken) {
        try {
          const tokenData = JSON.parse(atob(userToken.split('.')[1]));
          const expirationTime = tokenData.exp * 1000;
          const currentTime = Date.now();
          const isExpired = currentTime >= expirationTime - 60000; // 60 segundos antes de expirar

          // Se o token está expirando e não é uma requisição de refresh
          if (isExpired && !config.url?.includes('auth/RefreshToken') && !config.url?.includes('AppLogin')) {
            console.log('⚠️ Token expirando em breve, renovando...');

            if (!refreshTokenPromise) {
              refreshTokenPromise = refreshUserToken();
            }

            const success = await refreshTokenPromise;
            refreshTokenPromise = null;

            if (success) {
              const newUserToken = await AsyncStorage.getItem(USER_TOKEN_KEY);
              config.headers.Authorization = `Bearer ${newUserToken}`;
              console.log('✅ Token renovado no interceptor');
            } else {
              console.log('❌ Falha ao renovar token, usando token de app');
              const appToken = await AsyncStorage.getItem(APP_TOKEN_KEY);
              config.headers.Authorization = `Bearer ${appToken}`;
            }
          } else {
            // Token ainda válido, usa ele
            config.headers.Authorization = `Bearer ${userToken}`;
          }
        } catch (tokenError) {
          console.error('❌ Erro ao processar token:', tokenError);
          config.headers.Authorization = `Bearer ${userToken}`;
        }
      } else {
        // Sem token de usuário, usa token de app
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
          console.log(`⚠️ Erro ${error.response.status} em ${error.config.url}`);
          
          const isTokenExpired = error.response.headers?.['www-authenticate']?.includes('expired') ||
            error.response.headers?.['www-authenticate']?.includes('invalid_token');

          // Se erro 401/403 no login, tenta renovar token do app
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

          // Para outros endpoints protegidos, tenta renovar o token de usuário
          if (!error.config.url?.includes('AppLogin') &&
            !error.config.url?.includes('auth/login') &&
            !error.config.url?.includes('auth/RefreshToken') &&
            !originalRequest._retry) {
            try {
              const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
              const userToken = await AsyncStorage.getItem(USER_TOKEN_KEY);

              if (userToken) {
                originalRequest._retry = true;

                console.log('🔄 Tentando renovar token após erro 401/403...');

                if (!refreshTokenPromise) {
                  refreshTokenPromise = refreshUserToken();
                }

                const success = await refreshTokenPromise;
                refreshTokenPromise = null;

                if (success) {
                  const newUserToken = await AsyncStorage.getItem(USER_TOKEN_KEY);
                  error.config.headers.Authorization = `Bearer ${newUserToken}`;
                  console.log('✅ Retentando requisição com novo token');
                  return axiosInstance.request(error.config);
                } else {
                  console.log('❌ Falha ao renovar token de usuário');
                }
              } else {
                // Sem token de usuário, tenta renovar token do app
                originalRequest._retry = true;

                console.log('🔄 Sem token de usuário, renovando token do app...');

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
            console.log('❌ Recurso não encontrado:', error.config.url);
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
