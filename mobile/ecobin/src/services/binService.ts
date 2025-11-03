import { api } from './api';
import { Bin } from '../types';

/**
 * Serviço para gerenciar lixeiras
 */
export const binService = {
  /**
   * Busca todas as lixeiras
   */
  getAll: async (): Promise<Bin[]> => {
    return api.get<Bin[]>('/bins');
  },

  /**
   * Busca uma lixeira por ID
   */
  getById: async (id: string): Promise<Bin> => {
    return api.get<Bin>(`/bins/${id}`);
  },

  /**
   * Atualiza o status de uma lixeira
   */
  updateStatus: async (id: string, status: Bin['status']): Promise<Bin> => {
    return api.put<Bin>(`/bins/${id}`, { status });
  },
};
