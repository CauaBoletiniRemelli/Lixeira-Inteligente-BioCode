import { api } from './api';

export type SensorStatus = 'empty' | 'medium' | 'full';

export interface Sensor {
  id: string;
  name: string;
  qrCode: string;
  level: number;
  status: SensorStatus;
  location: {
    latitude: number;
    longitude: number;
  };
  condominiumId: string;
  condominiumName?: string;
  wifiSSID?: string;
  isOnline: boolean;
  lastUpdate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSensorRequest {
  name: string;
  qrCode: string;
  condominiumId: string;
  wifiSSID: string;
  wifiPassword: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface UpdateSensorRequest {
  name?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  wifiSSID?: string;
  wifiPassword?: string;
}

export interface SensorReading {
  sensorId: string;
  level: number;
  status: SensorStatus;
  timestamp: string;
}

export const sensorService = {
  getAll: async (): Promise<Sensor[]> => {
    return api.get<Sensor[]>('/sensors');
  },

  getById: async (id: string): Promise<Sensor> => {
    return api.get<Sensor>(`/sensors/${id}`);
  },

  getByCondominium: async (condominiumId: string): Promise<Sensor[]> => {
    return api.get<Sensor[]>(`/sensors/condominium/${condominiumId}`);
  },

  getByStatus: async (status: SensorStatus): Promise<Sensor[]> => {
    return api.get<Sensor[]>(`/sensors/status/${status}`);
  },

  create: async (data: CreateSensorRequest): Promise<Sensor> => {
    return api.post<Sensor>('/sensors', data);
  },

  update: async (id: string, data: UpdateSensorRequest): Promise<Sensor> => {
    return api.put<Sensor>(`/sensors/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/sensors/${id}`);
  },

  getReadings: async (sensorId: string, startDate?: string, endDate?: string): Promise<SensorReading[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get<SensorReading[]>(`/sensors/${sensorId}/readings${queryString}`);
  },

  sendAlert: async (sensorId: string, message?: string): Promise<{ message: string }> => {
    return api.post(`/sensors/${sensorId}/alert`, { message });
  },
};

export const binService = sensorService;
