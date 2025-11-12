import { OneSignal } from 'react-native-onesignal';
import * as Device from 'expo-device';
import { api } from './api';

export type NotificationType = 'alert' | 'warning' | 'info';

export interface Notification {
  id: number;
  usuarioId: number;
  titulo: string;
  mensagem: string;
  dados?: string;
  lida: boolean;
  dataEnvio: string;
  dataLeitura?: string;
}

export interface ExpoToken {
  id: number;
  usuarioId: number;
  token: string;
  dispositivo: string;
  plataforma: string;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface CreateNotificationRequest {
  titulo: string;
  mensagem: string;
  dados?: Record<string, any>;
}

export interface SendToCondominiumRequest extends CreateNotificationRequest {
  condominioId: number;
}

export interface SendToTypeRequest extends CreateNotificationRequest {
  condominioId: number;
  tipoUsuario: 1 | 2 | 3;
}

export interface RegisterDeviceRequest {
  usuarioId: number;
  token: string;
  dispositivo: string;
  plataforma: string;
}

export interface ResponseModel<T> {
  dados: T | null;
  mensagem: string;
  status: boolean;
}

class NotificationService {
  private ONESIGNAL_APP_ID = '72d3902a-cb02-48c9-b1f4-fd4faea52430';
  private currentUserId: number | null = null;

  async initialize(userId?: number) {
    if (userId) {
      this.currentUserId = userId;
    }

    OneSignal.Notifications.addEventListener('click', (event) => {
      const data = event.notification.additionalData;
      this.handleNotificationOpened(data);
    });

    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      event.preventDefault();
      event.notification.display();
    });
  }

  private handleNotificationOpened(data: any) {
    console.log('[OneSignal] Dados da notificação:', data);
  }

  async registerDevice(usuarioId: number): Promise<boolean> {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const playerId = await OneSignal.User.pushSubscription.getIdAsync();
      
      if (!playerId) {
        console.error('[NotificationService] Player ID não disponível');
        return false;
      }

      const deviceData: RegisterDeviceRequest = {
        usuarioId: usuarioId,
        token: playerId,
        dispositivo: `${Device.deviceName || 'Device'}`,
        plataforma: Device.manufacturer || 'Unknown',
      };

      const response = await api.post<ResponseModel<ExpoToken>>(
        '/ExpoTokens/token',
        deviceData
      );

      if (response.status) {
        this.currentUserId = usuarioId;
        return true;
      } else {
        console.error('[NotificationService] Erro ao registrar:', response.mensagem);
        return false;
      }
    } catch (error: any) {
      console.error('[NotificationService] Erro ao registrar dispositivo:', error);
      console.error('[NotificationService] Erro detalhado:', error.response?.data);
      console.error('[NotificationService] Status:', error.response?.status);
      return false;
    }
  }

  async listUserTokens(usuarioId: number): Promise<ExpoToken[]> {
    try {
      const response = await api.get<ResponseModel<ExpoToken[]>>(
        `/ExpoTokens/tokens/usuario/${usuarioId}`
      );
      return response.status ? response.dados || [] : [];
    } catch (error) {
      console.error('[NotificationService] Erro ao listar tokens:', error);
      return [];
    }
  }

  async deactivateToken(tokenId: number): Promise<boolean> {
    try {
      const response = await api.delete<ResponseModel<any>>(
        `/ExpoTokens/token/${tokenId}`
      );
      return response.status;
    } catch (error) {
      console.error('[NotificationService] Erro ao desativar token:', error);
      return false;
    }
  }

  async listNotifications(usuarioId?: number): Promise<Notification[]> {
    try {
      const userId = usuarioId || this.currentUserId;
      if (!userId) {
        console.error('[NotificationService] ID do usuário não definido');
        return [];
      }

      const response = await api.get<ResponseModel<Notification[]>>(
        `/ExpoTokens/notificacoes/usuario/${userId}`
      );
      return response.status ? response.dados || [] : [];
    } catch (error) {
      console.error('[NotificationService] Erro ao listar notificações:', error);
      return [];
    }
  }

  async listUnreadNotifications(usuarioId?: number): Promise<Notification[]> {
    try {
      const userId = usuarioId || this.currentUserId;
      if (!userId) {
        console.error('[NotificationService] ID do usuário não definido');
        return [];
      }

      const response = await api.get<ResponseModel<Notification[]>>(
        `/ExpoTokens/notificacoes/usuario/${userId}/nao-lidas`
      );
      return response.status ? response.dados || [] : [];
    } catch (error) {
      console.error('[NotificationService] Erro ao listar não lidas:', error);
      return [];
    }
  }

  async getUnreadCount(usuarioId?: number): Promise<number> {
    try {
      const unread = await this.listUnreadNotifications(usuarioId);
      return unread.length;
    } catch (error) {
      console.error('[NotificationService] Erro ao contar não lidas:', error);
      return 0;
    }
  }

  async markAsRead(notificacaoId: number): Promise<boolean> {
    try {
      const response = await api.put<ResponseModel<any>>(
        `/ExpoTokens/notificacoes/${notificacaoId}/marcar-lida`
      );
      return response.status;
    } catch (error) {
      console.error('[NotificationService] Erro ao marcar como lida:', error);
      return false;
    }
  }

  async markAllAsRead(usuarioId?: number): Promise<boolean> {
    try {
      const userId = usuarioId || this.currentUserId;
      if (!userId) {
        console.error('[NotificationService] ID do usuário não definido');
        return false;
      }

      const response = await api.put<ResponseModel<any>>(
        `/ExpoTokens/notificacoes/usuario/${userId}/marcar-todas-lidas`
      );
      return response.status;
    } catch (error) {
      console.error('[NotificationService] Erro ao marcar todas como lidas:', error);
      return false;
    }
  }

  async sendToUser(usuarioId: number, notification: CreateNotificationRequest): Promise<boolean> {
    try {
      const payload = {
        titulo: notification.titulo,
        mensagem: notification.mensagem,
        dados: notification.dados ? JSON.stringify(notification.dados) : undefined,
      };

      const response = await api.post<ResponseModel<any>>(
        `/ExpoTokens/notificacoes/enviar-usuario/${usuarioId}`,
        payload
      );
      return response.status;
    } catch (error) {
      console.error('[NotificationService] Erro ao enviar notificação:', error);
      return false;
    }
  }

  async sendToCondominium(request: SendToCondominiumRequest): Promise<{ success: boolean; count?: number }> {
    try {
      const payload = {
        titulo: request.titulo,
        mensagem: request.mensagem,
        dados: request.dados ? JSON.stringify(request.dados) : undefined,
      };

      const response = await api.post<ResponseModel<any[]>>(
        `/ExpoTokens/notificacoes/enviar-condominio/${request.condominioId}`,
        payload
      );

      return {
        success: response.status,
        count: response.dados?.length,
      };
    } catch (error) {
      console.error('[NotificationService] Erro ao enviar para condomínio:', error);
      return { success: false };
    }
  }

  async sendToUserType(request: SendToTypeRequest): Promise<{ success: boolean; count?: number }> {
    try {
      const payload = {
        condominioId: request.condominioId,
        tipoUsuario: request.tipoUsuario,
        titulo: request.titulo,
        mensagem: request.mensagem,
        dados: request.dados ? JSON.stringify(request.dados) : undefined,
      };

      const response = await api.post<ResponseModel<any[]>>(
        '/ExpoTokens/notificacoes/enviar-condominio-tipo',
        payload
      );

      return {
        success: response.status,
        count: response.dados?.length,
      };
    } catch (error:any) {
      console.error('[NotificationService] Erro ao registrar dispositivo:', error);
      console.error('[NotificationService] Erro detalhado:', error.response?.data);
      return { success: false };
    }
  }
}

export const notificationService = new NotificationService();