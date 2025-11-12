import { api } from './api';

export interface WiFiCredentials {
  ssid: string;
  password: string;
  sessionExpires: string;
  deviceId: string;
}

export interface ConfirmConfigRequest {
  deviceId: string;
  sessionToken: string;
  success: boolean;
}

export interface ResponseModel<T> {
  dados: T | null;
  mensagem: string;
  status: boolean;
}

export const deviceService = {
  getWiFiCredentials: async (
    deviceId: string,
    sessionToken: string
  ): Promise<ResponseModel<WiFiCredentials>> => {
    return api.get<ResponseModel<WiFiCredentials>>(
      `/Devices/${deviceId}/wifi-credentials?sessionToken=${sessionToken}`
    );
  },

  confirmConfig: async (
    deviceId: string,
    data: ConfirmConfigRequest
  ): Promise<ResponseModel<boolean>> => {
    return api.post<ResponseModel<boolean>>(`/Devices/${deviceId}/confirm-config`, data);
  },
};
