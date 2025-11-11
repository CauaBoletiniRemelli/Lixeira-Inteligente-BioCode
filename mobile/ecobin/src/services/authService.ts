import axios from 'axios';
import { api } from './api';
import { storage } from '../utils/storage';
import { ENV } from '../config/env';
import { APP_CREDENTIALS } from '../config/appCredentials';

const API_URL = ENV.API_URL;

export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface AuthModel {
  token: {
    token: string;
  } | string;
  refreshToken: string;
  userId: number;
  email: string;
  nome: string;
  tipo?: number;
  condominioId?: number;
  nomeCondominio?: string;
}

export interface ResponseModel<T> {
  dados: T | null;
  mensagem: string;
  status: boolean;
}

export interface LoginResponse {
  dados: AuthModel | null;
  mensagem: string;
  status: boolean;
}

export interface RefreshTokenRequest {
  AccessToken: string;
  RefreshToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'coletor' | 'sindico' | 'admin';
  condominiumId?: string;
}

export interface ForgotPasswordRequest {
  usuEmail: string;
}

export interface AppLoginRequest {
  appId: string;
  appSecret: string;
}

export const authService = {
  // Verifica se o token ainda está válido
  isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const now = Date.now();
      const isValid = now < expirationTime;
      
      console.log('🔍 Verificando validade do token:', {
        expira: new Date(expirationTime).toLocaleString(),
        agora: new Date(now).toLocaleString(),
        válido: isValid,
        tempoRestante: isValid ? Math.floor((expirationTime - now) / 1000 / 60) + ' minutos' : 'expirado'
      });
      
      return isValid;
    } catch (error) {
      console.error('❌ Erro ao verificar token:', error);
      return false;
    }
  },

  async appLogin(): Promise<AuthModel> {
    try {
      console.log('🔐 Iniciando AppLogin...');
      console.log('📍 API_URL:', API_URL);
      console.log('🔑 AppId:', APP_CREDENTIALS.appId);
      
      const response = await axios.post(`${API_URL}auth/AppLogin`, {
        appId: APP_CREDENTIALS.appId,
        appSecret: APP_CREDENTIALS.appSecret,
      });

      console.log('✅ AppLogin Response:', {
        status: response.data.status,
        hasToken: !!response.data.dados?.token,
      });

      if (response.data.status && response.data.dados) {
        await storage.saveAppToken(response.data.dados.token);
        return response.data.dados;
      }

      throw new Error(response.data.mensagem || 'Erro ao autenticar aplicativo');
    } catch (error: any) {
      console.error('❌ Erro no AppLogin:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('👤 Iniciando Login...');
      console.log('📧 Email:', data.Email);
      
      let appToken = await storage.getAppToken();
      console.log('🔍 AppToken do storage:', appToken ? 'Existe' : 'Não existe');

      // Verificar se o token existe e é válido
      let appTokenStr: string | null = null;
      
      if (appToken) {
        const tokenToCheck = typeof appToken === 'string' ? appToken : appToken.token;
        if (this.isTokenValid(tokenToCheck)) {
          appTokenStr = tokenToCheck;
          console.log('✅ AppToken válido, reutilizando...');
        } else {
          console.log('⚠️ AppToken expirado, renovando...');
          appToken = null;
        }
      }

      // Se não tem token ou está expirado, fazer novo AppLogin
      if (!appTokenStr) {
        console.log('⚠️ Fazendo novo AppLogin...');
        const appData = await this.appLogin();
        appTokenStr = typeof appData.token === 'string' ? appData.token : appData.token.token;
      }

      console.log('🔑 Usando AppToken:', appTokenStr?.substring(0, 20) + '...');

      const loginPayload = {
        Email: data.Email,
        Password: data.Password,
      };

      console.log('📤 Enviando requisição de login...');

      const response = await axios.post(
        `${API_URL}auth/Login`,
        loginPayload,
        {
          headers: {
            Authorization: `Bearer ${appTokenStr}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Login Response:', {
        status: response.data.status,
        hasToken: !!response.data.dados?.token,
        mensagem: response.data.mensagem,
      });

      if (response.data.status && response.data.dados) {
        const { token, refreshToken } = response.data.dados;

        await storage.saveTokens(token, refreshToken);
        await storage.saveUserData(response.data.dados);
        return response.data;
      }

      throw new Error(response.data.mensagem || 'Erro ao fazer login');
    } catch (error: any) {
      console.error('❌ Erro no Login:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      throw error;
    }
  },

  async refreshToken(): Promise<AuthModel> {
    try {
      console.log('🔄 Iniciando RefreshToken...');
      
      const refreshToken = await storage.getRefreshToken();
      const accessToken = await storage.getAccessToken();

      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      // Verificar e renovar AppToken se necessário
      let appToken = await storage.getAppToken();
      let appTokenStr: string | null = null;

      if (appToken) {
        const tokenToCheck = typeof appToken === 'string' ? appToken : appToken.token;
        if (this.isTokenValid(tokenToCheck)) {
          appTokenStr = tokenToCheck;
          console.log('✅ AppToken válido para refresh');
        } else {
          console.log('⚠️ AppToken expirado, renovando antes do refresh...');
        }
      }

      if (!appTokenStr) {
        console.log('⚠️ Fazendo novo AppLogin para refresh...');
        const appData = await this.appLogin();
        appTokenStr = typeof appData.token === 'string' ? appData.token : appData.token.token;
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

        console.log('✅ Token renovado com sucesso');
        return response.data.dados;
      }

      throw new Error(response.data.mensagem || 'Erro ao renovar token');
    } catch (error: any) {
      console.error('❌ Erro ao renovar token:', error);
      throw error;
    }
  },

  async logout(refreshToken: string): Promise<ResponseModel<null>> {
    try {
      if (refreshToken) {
        await api.post('auth/logout', { RefreshToken: refreshToken });
      }
      
      return {
        dados: null,
        mensagem: 'Logout realizado com sucesso',
        status: true,
      };
    } catch (error: any) {
      console.error('❌ Erro ao fazer logout:', error);
      return {
        dados: null,
        mensagem: error.message || 'Erro ao fazer logout',
        status: false,
      };
    } finally {
      await storage.clearAll();
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const refreshToken = await storage.getRefreshToken();
    const userData = await storage.getUserData();
    return !!(refreshToken && userData);
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    return api.post(`/auth/forgot-password?usuEmail=${encodeURIComponent(data.usuEmail)}`);
  },
};
