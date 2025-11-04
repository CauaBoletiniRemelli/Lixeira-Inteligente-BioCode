import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  tipo: number; // 0 = naoDefinido, 1 = admin, 2 = sindico, 3 = coletor
  condominiumId?: string;
  condominiumName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  tipo: number; // 0 = naoDefinido, 1 = admin, 2 = sindico, 3 = coletor
  condominiumId?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  tipo?: number; // 0 = naoDefinido, 1 = admin, 2 = sindico, 3 = coletor
  condominiumId?: string;
}

export const userService = {
  // Listar todos os usuários
  getAll: async (): Promise<User[]> => {
    return api.get<User[]>('/users');
  },

  // Obter usuário por ID
  getById: async (id: string): Promise<User> => {
    return api.get<User>(`/users/${id}`);
  },

  // Criar usuário
  create: async (data: CreateUserRequest): Promise<User> => {
    return api.post<User>('/users', data);
  },

  // Atualizar usuário
  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    return api.put<User>(`/users/${id}`, data);
  },

  // Deletar usuário
  delete: async (id: string): Promise<void> => {
    return api.delete(`/users/${id}`);
  },

  // Listar usuários por condomínio
  getByCondominium: async (condominiumId: string): Promise<User[]> => {
    return api.get<User[]>(`/users/condominium/${condominiumId}`);
  },

  // Listar usuários por tipo
  getByTipo: async (tipo: number): Promise<User[]> => {
    return api.get<User[]>(`/users/tipo/${tipo}`);
  },
};
