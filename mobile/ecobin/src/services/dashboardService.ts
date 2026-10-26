import { api } from './api';
import {
  DashboardGeral,
  NivelTempoSensor,
  VolumeReciclavel,
  RankingItem,
  EvolucaoMensal,
  EficienciaColeta,
  TempoEnchimento,
  DashboardAlertas,
  ImpactoAmbiental,
  UsoDiaSemana,
  Economia,
  PainelColetor,
} from '../types';

interface DateFilter {
  dataInicio?: string;
  dataFim?: string;
}

const base = (condominioId: number) => `/Dashboard/condominio/${condominioId}`;

export const dashboardService = {
  async getDashboardGeral(condominioId: number, filter?: DateFilter): Promise<DashboardGeral> {
    const response = await api.get(base(condominioId), { params: filter });
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },

  async getPainelColetor(condominioId: number): Promise<PainelColetor> {
    const response = await api.get(`${base(condominioId)}/coletor`);
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },

  async getNivelTempo(
    condominioId: number,
    filter?: DateFilter & { granularidade?: 'Hora' | 'Dia' | 'Semana' | 'Mes' },
  ): Promise<NivelTempoSensor[]> {
    const response = await api.get(`${base(condominioId)}/nivel-tempo`, { params: filter });
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },

  async getReciclavel(condominioId: number, filter?: DateFilter): Promise<VolumeReciclavel> {
    const response = await api.get(`${base(condominioId)}/reciclavel`, { params: filter });
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },

  async getRanking(condominioId: number, filter?: DateFilter): Promise<RankingItem[]> {
    const response = await api.get(`${base(condominioId)}/ranking`, { params: filter });
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },

  async getEvolucaoMensal(condominioId: number, meses = 6): Promise<EvolucaoMensal[]> {
    const response = await api.get(`${base(condominioId)}/evolucao-mensal`, { params: { meses } });
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },

  async getEficienciaColeta(condominioId: number, filter?: DateFilter): Promise<EficienciaColeta[]> {
    const response = await api.get(`${base(condominioId)}/eficiencia-coleta`, { params: filter });
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },

  async getTempoEnchimento(condominioId: number): Promise<TempoEnchimento[]> {
    const response = await api.get(`${base(condominioId)}/tempo-enchimento`);
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },

  async getAlertas(condominioId: number): Promise<DashboardAlertas> {
    const response = await api.get(`${base(condominioId)}/alertas`);
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },

  async getImpactoAmbiental(condominioId: number, filter?: DateFilter): Promise<ImpactoAmbiental> {
    const response = await api.get(`${base(condominioId)}/impacto-ambiental`, { params: filter });
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },

  async getUsoDiaSemana(condominioId: number, filter?: DateFilter): Promise<UsoDiaSemana[]> {
    const response = await api.get(`${base(condominioId)}/uso-dia-semana`, { params: filter });
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },

  async getEconomia(
    condominioId: number,
    filter?: DateFilter & { custoMedioColeta?: number },
  ): Promise<Economia> {
    const response = await api.get(`${base(condominioId)}/economia`, { params: filter });
    if (!response.status) throw new Error(response.mensagem);
    return response.dados;
  },
};
