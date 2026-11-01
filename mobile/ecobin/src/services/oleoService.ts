import { api } from './api';
import { OleoColeta } from '../types';

export interface OleoColetaCreate {
  condominioId: number;
  sensorId?: number | null;
  litros: number;
  destino?: string;
  observacao?: string;
  dataColeta?: string;
}

export const oleoService = {
  async registrarColeta(data: OleoColetaCreate): Promise<OleoColeta> {
    try {
      const response = await api.post('/OleoColetas', data);
      if (!response.status) throw new Error(response.mensagem);
      return response.dados;
    } catch (e: any) {
      throw new Error(e?.response?.data?.mensagem || e?.message || 'Erro ao registrar coleta de óleo.');
    }
  },

  async getColetas(condominioId: number, dataInicio?: string, dataFim?: string): Promise<OleoColeta[]> {
    const response = await api.get(`/OleoColetas/condominio/${condominioId}`, { params: { dataInicio, dataFim } });
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },
};
