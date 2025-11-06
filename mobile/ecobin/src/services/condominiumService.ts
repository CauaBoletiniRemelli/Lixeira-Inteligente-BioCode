import { api } from './api';

export interface Condominium {
  id: string;
  nome: string;
  endereco: string;
  cep: string;
  status?: 'active' | 'inactive';
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface CreateCondominiumRequest {
  nome: string;
  endereco: string;
  cep: string;
  status?: 'active' | 'inactive';
}

export interface UpdateCondominiumRequest {
  nome?: string;
  endereco?: string;
  cep?: string;
  status?: 'active' | 'inactive';
}

export interface ResponseModel<T> {
  dados: T | null;
  mensagem: string;
  status: boolean;
}

export const condominiumService = {
  getAll: async (): Promise<ResponseModel<Condominium[]>> => {
    return api.get<ResponseModel<Condominium[]>>('/Condominios');
  },

  getById: async (id: string): Promise<ResponseModel<Condominium>> => {
    return api.get<ResponseModel<Condominium>>(`/Condominios/${id}`);
  },

  create: async (data: CreateCondominiumRequest): Promise<ResponseModel<Condominium>> => {
    return api.post<ResponseModel<Condominium>>('/Condominios', data);
  },

  update: async (id: string, data: UpdateCondominiumRequest): Promise<ResponseModel<Condominium>> => {
    return api.put<ResponseModel<Condominium>>(`/Condominios/${id}`, data);
  },

  delete: async (id: string): Promise<ResponseModel<null>> => {
    return api.delete<ResponseModel<null>>(`/Condominios/${id}`);
  },

  getActive: async (): Promise<ResponseModel<Condominium[]>> => {
    return api.get<ResponseModel<Condominium[]>>('/Condominios/active');
  },
};
