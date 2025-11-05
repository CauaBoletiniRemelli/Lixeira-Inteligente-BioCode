import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = 'https://ecobinapi.runasp.net/api/';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const token = await AsyncStorage.getItem('@ecobin:token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[Token Error]', error);
    }
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API Error] ${error.response.status}:`, error.response.data);
      
      switch (error.response.status) {
        case 401:
          console.log('Não autorizado - Token inválido ou expirado');
          break;
        case 403:
          console.log('Acesso negado - Sem permissão');
          break;
        case 404:
          console.log('Recurso não encontrado');
          break;
        case 500:
          console.log('Erro interno do servidor');
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
};

export { axiosInstance };

export default api;
