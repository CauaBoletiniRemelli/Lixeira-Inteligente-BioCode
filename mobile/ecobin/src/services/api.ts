import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Configuração da API
const API_URL = 'https://ecobinapi.runasp.net';

// Criar instância do axios
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requisições (adicionar token, logs, etc)
axiosInstance.interceptors.request.use(
  async (config) => {
    // Adicionar o token de autenticação (se existir)
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

// Interceptor para respostas (tratamento de erros, refresh token, etc)
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Erro de resposta do servidor (4xx, 5xx)
      console.error(`[API Error] ${error.response.status}:`, error.response.data);
      
      // Tratamento específico por status code
      switch (error.response.status) {
        case 401:
          console.log('Não autorizado - Token inválido ou expirado');
          // Aqui você pode fazer logout ou refresh token
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
      // Erro de rede (sem resposta do servidor)
      console.error('[API Network Error]', error.message);
    } else {
      // Outro tipo de erro
      console.error('[API Error]', error.message);
    }
    
    return Promise.reject(error);
  }
);

export const api = {
  // GET request
  get: async <T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<T> = await axiosInstance.get(endpoint, config);
    return response.data;
  },

  // POST request
  post: async <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<T> = await axiosInstance.post(endpoint, data, config);
    return response.data;
  },

  // PUT request
  put: async <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<T> = await axiosInstance.put(endpoint, data, config);
    return response.data;
  },

  // PATCH request
  patch: async <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<T> = await axiosInstance.patch(endpoint, data, config);
    return response.data;
  },

  // DELETE request
  delete: async <T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<T> = await axiosInstance.delete(endpoint, config);
    return response.data;
  },
};

// Exportar a instância do axios para casos específicos
export { axiosInstance };

export default api;
