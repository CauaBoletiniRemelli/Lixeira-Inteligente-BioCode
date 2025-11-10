import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import { ENV } from '../config/env';
import { APP_CREDENTIALS } from '../config/appCredentials';

const API_URL = ENV.API_URL;

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

async function authenticateApp(): Promise<string> {
  try {
    const savedAppToken = await storage.getAppToken();
    if (savedAppToken && savedAppToken.token) {
      return savedAppToken.token;
    }

    const response = await axios.post(`${API_URL}auth/AppLogin`, {
      appId: APP_CREDENTIALS.appId,
      appSecret: APP_CREDENTIALS.appSecret,
    });

    if (response.data?.status && response.data?.dados?.token) {
      const token = typeof response.data.dados.token === 'string'
        ? response.data.dados.token
        : response.data.dados.token.token;

      await storage.saveAppToken({ token });
      return token;
    }

    throw new Error('Falha na autenticação do aplicativo');
  } catch (error: any) {
    console.error('❌ Erro ao autenticar app:', error.message);
    throw error;
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
  async (config: InternalAxiosRequestConfig) => {
    try {
      const accessToken = await storage.getAccessToken();

      if (accessToken && accessToken.token) {
        config.headers.Authorization = `Bearer ${accessToken.token}`;
      } else {
        const appToken = await storage.getAppToken();
        
        if (!appToken || !appToken.token) {
          const newAppToken = await authenticateApp();
          config.headers.Authorization = `Bearer ${newAppToken}`;
        } else {
          config.headers.Authorization = `Bearer ${appToken.token}`;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar token na requisição:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/RefreshToken') &&
      !originalRequest.url.includes('/Login') &&
      !originalRequest.url.includes('/AppLogin')
    ) {

      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        const accessToken = await storage.getAccessToken();

        if (!refreshToken) {
          throw new Error('Refresh token não encontrado');
        }

        const appToken = await storage.getAppToken();
        let appTokenStr = appToken?.token;

        if (!appTokenStr) {
          appTokenStr = await authenticateApp();
        }

        const response = await axios.post(
          `${API_URL}auth/RefreshToken`,
          {
            AccessToken: accessToken?.token || null,
            RefreshToken: refreshToken,
          },
          {
            headers: {
              Authorization: `Bearer ${appTokenStr}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data.status && response.data.dados) {
          const { token, refreshToken: newRefreshToken } = response.data.dados;

          await storage.saveTokens(token, newRefreshToken);
          await storage.saveUserData(response.data.dados);

          const newToken = typeof token === 'string' ? token : token.token;

          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          onRefreshed(newToken);
          isRefreshing = false;

          return axiosInstance(originalRequest);
        } else {
          throw new Error('Falha ao renovar token');
        }
      } catch (refreshError: any) {
        console.error('❌ Erro ao renovar token:', refreshError.message);
        isRefreshing = false;
        refreshSubscribers = [];

        await storage.clearAll();

        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {      
      const accessToken = await storage.getAccessToken();
      
      if (!accessToken) {
        console.log('❌ Tentando acessar recurso protegido sem token de usuário');
      }
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
};

export { axiosInstance };
export default api;
