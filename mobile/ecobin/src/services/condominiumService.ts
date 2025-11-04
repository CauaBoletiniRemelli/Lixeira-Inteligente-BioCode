import { api } from './api';

export interface Condominium {
  id: string;
  name: string;
  address: string;
  cep: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCondominiumRequest {
  name: string;
  address: string;
  cep: string;
  status?: 'active' | 'inactive';
}

export interface UpdateCondominiumRequest {
  name?: string;
  address?: string;
  cep?: string;
  status?: 'active' | 'inactive';
}

export const condominiumService = {
  // Listar todos os condomínios
  getAll: async (): Promise<Condominium[]> => {
    return api.get<Condominium[]>('/condominiums');
  },

  // Obter condomínio por ID
  getById: async (id: string): Promise<Condominium> => {
    return api.get<Condominium>(`/condominiums/${id}`);
  },

  // Criar condomínio
  create: async (data: CreateCondominiumRequest): Promise<Condominium> => {
    return api.post<Condominium>('/condominiums', data);
  },

  // Atualizar condomínio
  update: async (id: string, data: UpdateCondominiumRequest): Promise<Condominium> => {
    return api.put<Condominium>(`/condominiums/${id}`, data);
  },

  // Deletar condomínio
  delete: async (id: string): Promise<void> => {
    return api.delete(`/condominiums/${id}`);
  },

  // Listar condomínios ativos
  getActive: async (): Promise<Condominium[]> => {
    return api.get<Condominium[]>('/condominiums/active');
  },
};
