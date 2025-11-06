import { api } from './api';

export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface AuthModel {
  token: {
    token: string;
  };
  refreshToken: string;
  userId: number;
  email: string;
  nome: string;
  tipo?: number;
  condominiumId?: number;
  condominiumName?: string;
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
  accessToken: string;
  refreshToken: string;
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
  appLogin: async (data: AppLoginRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>('auth/AppLogin', data);
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>('auth/login', data);
  },

  refreshToken: async (data: RefreshTokenRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>('auth/refreshtoken', data);
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    return api.post(`/auth/forgot-password?usuEmail=${encodeURIComponent(data.usuEmail)}`);
  },

  logout: async (refreshToken: string): Promise<ResponseModel<null>> => {
    return api.post('auth/logout', { refreshToken });
  },
};
