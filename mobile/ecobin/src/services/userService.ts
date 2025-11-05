import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  tipo: number; 
  condominiumId?: string;
  condominiumName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  tipo: number; 
  condominiumId?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  tipo?: number; 
  condominiumId?: string;
}

export interface ChangePassword {
  id: number;
  oldPassword: string;
  newPassword: string;
}

export const userService = {
  getAll: async (): Promise<User[]> => {
    return api.get<User[]>('/users');
  },

  getById: async (id: string): Promise<User> => {
    return api.get<User>(`/users/${id}`);
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    return api.post<User>('/users', data);
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    return api.put<User>(`/users/${id}`, data);
  },

  updatePassword: async (data: ChangePassword): Promise<string> => {
    return api.post<string>(`/Usuarios/change-password`, data);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/users/${id}`);
  },

  getByCondominium: async (condominiumId: string): Promise<User[]> => {
    return api.get<User[]>(`/users/condominium/${condominiumId}`);
  },

  getByTipo: async (tipo: number): Promise<User[]> => {
    return api.get<User[]>(`/users/tipo/${tipo}`);
  },
};
