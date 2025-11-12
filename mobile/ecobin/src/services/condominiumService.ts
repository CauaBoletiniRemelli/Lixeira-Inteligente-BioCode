import { api } from './api';

export interface Condominium {
  id: number;
  nome: string;
  endereco: string;
  cep: string;
  ativo?: boolean;
  status?: 'active' | 'inactive';
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface CreateCondominiumRequest {
  Nome: string;
  Endereco: string;
  CEP: string;
  Ativo?: boolean;
}

export interface UpdateCondominiumRequest {
  Id: number;
  Nome?: string;
  Endereco?: string;
  CEP?: string;
  Ativo?: boolean;
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

  update: async (id: number, data: UpdateCondominiumRequest): Promise<ResponseModel<Condominium>> => {
    return api.put<ResponseModel<Condominium>>('/Condominios', data);
  },

  delete: async (id: number): Promise<ResponseModel<null>> => {
    return api.delete<ResponseModel<null>>(`/Condominios/${id}`);
  },

  getActive: async (): Promise<ResponseModel<Condominium[]>> => {
    return api.get<ResponseModel<Condominium[]>>('/Condominios/active');
  },
};
