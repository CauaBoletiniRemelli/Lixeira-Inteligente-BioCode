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
  async appLogin(): Promise<AuthModel> {
    try {
      const response = await axios.post(`${API_URL}auth/AppLogin`, {
        appId: APP_CREDENTIALS.appId,
        appSecret: APP_CREDENTIALS.appSecret,
      });

      if (response.data.status && response.data.dados) {
        await storage.saveAppToken(response.data.dados.token);
        return response.data.dados;
      }

      throw new Error(response.data.mensagem || 'Erro ao autenticar aplicativo');
    } catch (error: any) {
      console.error('❌ Erro no AppLogin:', error);
      throw error;
    }
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      let appToken = await storage.getAppToken();

      if (!appToken || !appToken.token) {
        const appData = await this.appLogin();
        appToken = appData.token;
      }

      const appTokenStr = typeof appToken === 'string' ? appToken : appToken.token;

      const response = await axios.post(
        `${API_URL}auth/Login`,
        {
          Email: data.Email,
          Password: data.Password,
        },
        {
          headers: {
            Authorization: `Bearer ${appTokenStr}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status && response.data.dados) {
        const { token, refreshToken } = response.data.dados;

        await storage.saveTokens(token, refreshToken);
        await storage.saveUserData(response.data.dados);

        console.log('✅ Login realizado com sucesso');
        return response.data;
      }

      throw new Error(response.data.mensagem || 'Erro ao fazer login');
    } catch (error: any) {
      console.error('❌ Erro no Login:', error);
      throw error;
    }
  },

  async refreshToken(): Promise<AuthModel> {
    try {
      const refreshToken = await storage.getRefreshToken();
      const accessToken = await storage.getAccessToken();

      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      let appToken = await storage.getAppToken();
      if (!appToken || !appToken.token) {
        const appData = await this.appLogin();
        appToken = appData.token;
      }

      const appTokenStr = typeof appToken === 'string' ? appToken : appToken.token;

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
