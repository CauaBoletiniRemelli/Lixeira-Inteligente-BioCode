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

export interface AtivarQRRequest {
  provisionId: string;
  deviceId: string;
  token: string;
  condominioId: number;
  nomeSensor: string;
  latitude: number;
  longitude: number;
  wifiSSID: string;
  wifiPassword: string;
}

export interface AtivarQRResponse {
  success: boolean;
  deviceId: string;
  sensorId: number;
  sessionToken: string;
  sessionExpires: string;
  message: string;
}

export interface ResponseModel<T> {
  dados: T | null;
  mensagem: string;
  status: boolean;
}

export const provisionamentoService = {
  criar: async (data: CreateProvisionamentoRequest): Promise<ResponseModel<Provisionamento>> => {
    return api.post<ResponseModel<Provisionamento>>('/Provisionamentos/criar', data);
  },

  gerarQR: async (provisionId: number): Promise<Blob> => {
    const response = await api.get<Blob>(`/Provisionamentos/gerar-qr/${provisionId}`, {
      responseType: 'blob',
    });
    return response;
  },

  ativarQR: async (data: AtivarQRRequest): Promise<ResponseModel<AtivarQRResponse>> => {
    return api.post<ResponseModel<AtivarQRResponse>>('/Provisionamentos/ativar-qr', data);
  },

  listar: async (): Promise<ResponseModel<Provisionamento[]>> => {
    return api.get<ResponseModel<Provisionamento[]>>('/Provisionamentos');
  },

  buscarPorId: async (id: number): Promise<ResponseModel<Provisionamento>> => {
    return api.get<ResponseModel<Provisionamento>>(`/Provisionamentos/${id}`);
  },
};
