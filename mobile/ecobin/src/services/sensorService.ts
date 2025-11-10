import { api } from './api';

export interface Sensor {
  id: number;
  deviceId: string;
  nome: string;
  condominioId: number;
  nomeCondominio?: string;
  latitude: number;
  longitude: number;
  status: number;
  nivelAtual?: number;
  ultimaAtualizacao?: string;
  criadoEm: string;
}

export interface SensorCreateDTO {
  deviceId: string;
  nome: string;
  condominioId: number;
  latitude: number;
  longitude: number;
}

export interface SensorEditDTO {
  id: number;
  deviceId?: string;
  nome?: string;
  condominioId?: number;
  latitude?: number;
  longitude?: number;
  status?: number;
}

export interface SensorUpdateLocaleDTO {
  id: number;
  latitude: number;
  longitude: number;
}

export interface ResponseModel<T> {
  dados: T | null;
  mensagem: string;
  status: boolean;
}

export const sensorService = {
  getAll: async (): Promise<ResponseModel<Sensor[]>> => {
    return api.get<ResponseModel<Sensor[]>>('/Sensores');
  },

  getByCondominio: async (idCondominio: number): Promise<ResponseModel<Sensor[]>> => {
    return api.get<ResponseModel<Sensor[]>>(`/Sensores/${idCondominio}`);
  },

  create: async (data: SensorCreateDTO): Promise<ResponseModel<Sensor>> => {
    return api.post<ResponseModel<Sensor>>('/Sensores', data);
  },

  update: async (data: SensorEditDTO): Promise<ResponseModel<Sensor>> => {
    return api.put<ResponseModel<Sensor>>('/Sensores', data);
  },

  updateLocale: async (idSensor: number, data: SensorUpdateLocaleDTO): Promise<ResponseModel<Sensor>> => {
    return api.put<ResponseModel<Sensor>>(`/Sensores/update-locale-${idSensor}`, data);
  },

  delete: async (idSensor: number): Promise<ResponseModel<any>> => {
    return api.delete<ResponseModel<any>>(`/Sensores/${idSensor}`);
  },
};
