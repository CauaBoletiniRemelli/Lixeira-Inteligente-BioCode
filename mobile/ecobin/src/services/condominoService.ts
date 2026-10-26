import { api } from './api';
import { LixeiraStatus, ImpactoAmbiental, ColetaHistorico } from '../types';

interface CondominoHome {
  lixeiras: LixeiraStatus[];
  impactoMes: Omit<ImpactoAmbiental, 'totalColetas'>;
  ultimasColetas: ColetaHistorico[];
}

export interface PeriodParams {
  dataInicio?: string;
  dataFim?: string;   
}

export const condominoService = {
  async getHome(condominioId?: number): Promise<CondominoHome> {
    const response = await api.get('/Condominos/home', {
      params: condominioId ? { condominioId } : undefined,
    });
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },

  async getLixeiras(condominioId?: number): Promise<LixeiraStatus[]> {
    const response = await api.get('/Condominos/lixeiras', {
      params: condominioId ? { condominioId } : undefined,
    });
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },

  async getImpacto(condominioId?: number, period?: PeriodParams): Promise<Omit<ImpactoAmbiental, 'totalColetas'>> {
    const response = await api.get('/Condominos/impacto', {
      params: {
        ...(condominioId ? { condominioId } : {}),
        ...(period?.dataInicio ? { dataInicio: period.dataInicio } : {}),
        ...(period?.dataFim ? { dataFim: period.dataFim } : {}),
      },
    });
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },

  async getColetas(limite = 10, condominioId?: number, period?: PeriodParams): Promise<ColetaHistorico[]> {
    const response = await api.get('/Condominos/coletas', {
      params: {
        limite,
        ...(condominioId ? { condominioId } : {}),
        ...(period?.dataInicio ? { dataInicio: period.dataInicio } : {}),
        ...(period?.dataFim ? { dataFim: period.dataFim } : {}),
      },
    });
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },
};
