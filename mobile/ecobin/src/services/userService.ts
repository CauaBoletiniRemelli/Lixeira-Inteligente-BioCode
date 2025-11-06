import { api } from './api';

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: number; 
  condominioId?: string;
  condominio?: string;
  criadoEm?: string;
  senhaHash?: string;
}

export interface CreateUserRequest {
  Nome: string;
  Email: string;
  SenhaHash: string;
  Tipo: number; 
  CondominioId?: number;
}

export interface UpdateUserRequest {
  Id: number;
  Nome?: string;
  Email?: string;
  SenhaHash?: string;
  Tipo?: number; 
  CondominioId?: number;
}

export interface ChangePassword {
  id: number;
  oldPassword: string;
  newPassword: string;
}

export interface ChangeEmail {
  id: number;
  oldEmail: string;
  newEmail: string;
}

export interface ResponseModel<T> {
  dados: T | null;
  mensagem: string;
  status: boolean;
}

export const userService = {
  getAll: async (): Promise<ResponseModel<User[]>> => {
    return api.get<ResponseModel<User[]>>('/Usuarios');
  },

  getById: async (id: string): Promise<ResponseModel<User>> => {
    return api.get<ResponseModel<User>>(`/Usuarios/${id}`);
  },

  create: async (data: CreateUserRequest): Promise<ResponseModel<User>> => {
    return api.post<ResponseModel<User>>('/Usuarios', data);
  },

  update: async (id: string, data: UpdateUserRequest): Promise<ResponseModel<User>> => {
    const updateData = { ...data, Id: Number(id) };
    return api.put<ResponseModel<User>>('/Usuarios', updateData);
  },

  updatePassword: async (data: ChangePassword): Promise<ResponseModel<null>> => {
    return api.post<ResponseModel<null>>(`/Usuarios/change-password`, data);
  },

  updateEmail: async (data: ChangeEmail): Promise<ResponseModel<null>> => {
    console.log('🔵 userService.updateEmail - Dados recebidos:', data);
    console.log('🔵 userService.updateEmail - Endpoint:', '/Usuarios/change-email');
    const response = await api.post<ResponseModel<null>>(`/Usuarios/change-email`, data);
    console.log('🔵 userService.updateEmail - Resposta recebida:', response);
    return response;
  },

  delete: async (id: string): Promise<ResponseModel<null>> => {
    return api.delete<ResponseModel<null>>(`/Usuarios/${id}`);
  },

  getByCondominium: async (condominiumId: string): Promise<ResponseModel<User[]>> => {
    return api.get<ResponseModel<User[]>>(`/Usuarios/condominium/${condominiumId}`);
  },

  getByTipo: async (tipo: number): Promise<ResponseModel<User[]>> => {
    return api.get<ResponseModel<User[]>>(`/Usuarios/tipo/${tipo}`);
  },
};
