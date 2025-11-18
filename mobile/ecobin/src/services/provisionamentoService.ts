import { api } from './api';

export interface Provisionamento {
  id: number;
  sensorId: number;
  usuarioId: number;
  expiracao: string;
  usado: boolean;
  criadoEm: string;
}

export interface CreateProvisionamentoRequest {
  sensorId: number;
  usuarioId: number;
  expiracaoDias?: number;
}

export interface CreateProvisionamentoComSensorRequest {
  nomeSensor: string;
  condominioId: number;
  usuarioId: number;
  expiracaoDias?: number;
}

export interface AtivarQRRequest {
  provisionId?: string;
  deviceId: string;
  token: string;
  condominioId?: number;
  nomeSensor?: string;
  latitude?: number;
  longitude?: number;
}

export interface AtivarQRResponse {
  deviceId: string;
  sensorId?: number;
  sessionToken: string;
  sessionExpires?: string;
  message?: string;
}

export interface AssignWifiRequest {
  wifiSSID: string;
  wifiPassword: string;
}

export interface ProvisionStatusDto {
  status: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'FAILED' | string;
}

export interface ResponseModel<T> {
  dados: T | null;
  mensagem: string;
  status: boolean;
}

export const provisionamentoService = {
  criar: async (data: CreateProvisionamentoRequest): Promise<ResponseModel<Provisionamento>> => {
    const resp = await api.post<ResponseModel<Provisionamento>>('/Provisionamentos/criar', data);
    return resp;
  },

  criarComSensor: async (data: CreateProvisionamentoComSensorRequest): Promise<ResponseModel<Provisionamento>> => {
    const resp = await api.post<ResponseModel<Provisionamento>>('/Provisionamentos/criar-com-sensor', data);
    return resp;
  },

  gerarQR: async (provisionId: number): Promise<Blob> => {
    const resp = await api.get<Blob>(`/Provisionamentos/gerar-qr/${provisionId}`, {
      responseType: 'blob',
    });
    return resp;
  },

  ativarQR: async (data: AtivarQRRequest): Promise<ResponseModel<AtivarQRResponse>> => {
    const resp = await api.post<ResponseModel<AtivarQRResponse>>('/Provisionamentos/ativar-qr', data);
    return resp;
  },

  assignWifi: async (sessionToken: string, wifiPayload: AssignWifiRequest): Promise<ResponseModel<object>> => {
    const resp = await api.post<ResponseModel<object>>(`/Provisionamentos/${encodeURIComponent(sessionToken)}/assign-wifi`, wifiPayload);
    return resp;
  },

  getProvisionStatus: async (sessionToken: string): Promise<ResponseModel<ProvisionStatusDto>> => {
    const resp = await api.get<ResponseModel<ProvisionStatusDto>>(`/Provisionamentos/session-status/${encodeURIComponent(sessionToken)}`);
    return resp;
  },

  listar: async (): Promise<ResponseModel<Provisionamento[]>> => {
    const resp = await api.get<ResponseModel<Provisionamento[]>>('/Provisionamentos');
    return resp;
  },

  buscarPorId: async (id: number): Promise<ResponseModel<Provisionamento>> => {
    const resp = await api.get<ResponseModel<Provisionamento>>(`/Provisionamentos/${id}`);
    return resp;
  },
};
