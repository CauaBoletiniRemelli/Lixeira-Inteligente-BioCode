import { api } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthModel {
  token: {
    token: string;
  };
  refreshToken: string;
  userId: number;
  email: string;
  nome: string;
  tipo?: number; // 0 = naoDefinido, 1 = admin, 2 = sindico, 3 = coletor
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
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export const authService = {
  // Login
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/api/auth/login', data);
  },

  // Refresh Token
  refreshToken: async (data: RefreshTokenRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/api/auth/refreshtoken', data);
  },

  // Registro
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/auth/register', data);
  },

  // Esqueci a senha
  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    return api.post('/auth/forgot-password', data);
  },

  // Resetar senha
  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    return api.post('/auth/reset-password', data);
  },

  // Alterar senha
  changePassword: async (data: ChangePasswordRequest): Promise<ResponseModel<null>> => {
    return api.post('/auth/change-password', data);
  },

  // Atualizar perfil
  updateProfile: async (data: UpdateProfileRequest): Promise<ResponseModel<AuthModel>> => {
    return api.put('/auth/profile', data);
  },

  // Obter perfil atual
  getProfile: async (): Promise<ResponseModel<AuthModel>> => {
    return api.get('/auth/profile');
  },

  // Logout
  logout: async (refreshToken: string): Promise<ResponseModel<null>> => {
    return api.post('/api/auth/logout', { refreshToken });
  },
};
