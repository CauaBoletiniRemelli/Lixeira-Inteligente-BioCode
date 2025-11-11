import { OneSignal } from 'react-native-onesignal';
import * as Device from 'expo-device';
import { api } from './api';
import { getToken } from '../utils/storage';

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

class NotificationService {
  private ONESIGNAL_APP_ID = '72d3902a-cb02-48c9-b1f4-fd4faea52430';
  private currentUserId: number | null = null;

  async initialize(userId?: number) {
    if (userId) {
      this.currentUserId = userId;
    }

    OneSignal.Notifications.addEventListener('click', (event) => {
      console.log('[OneSignal] Notificação clicada:', event);
      const data = event.notification.additionalData;
      this.handleNotificationOpened(data);
    });

    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      console.log('[OneSignal] Notificação recebida em foreground:', event);
      event.preventDefault();
      event.notification.display();
    });
  }

  private handleNotificationOpened(data: any) {
    console.log('[OneSignal] Dados da notificação:', data);
    // Aqui você pode adicionar navegação baseada nos dados
    // Por exemplo: navigation.navigate('SensorDetails', { sensorId: data.sensorId });
  }

  async registerDevice(usuarioId: number): Promise<boolean> {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const playerId = await OneSignal.User.pushSubscription.getIdAsync();
      
      if (!playerId) {
        console.error('[NotificationService] Player ID não disponível');
        return false;
      }

      const token = await getToken();
      
      const response = await fetch('https://ecobinapi.runasp.net/api/ExpoTokens/token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuarioId: usuarioId,
          token: playerId,
          dispositivo: `${Device.brand || 'Unknown'} ${Device.modelName || 'Device'}`,
          plataforma: Device.osName || 'Unknown',
        }),
      });

      const data = await response.json();
      
      if (data.status) {
        console.log('[NotificationService] Dispositivo registrado:', data.mensagem);
        this.currentUserId = usuarioId;
        return true;
      } else {
        console.error('[NotificationService] Erro ao registrar:', data.mensagem);
        return false;
      }
    } catch (error) {
      console.error('[NotificationService] Erro ao registrar dispositivo:', error);
      return false;
    }
  }

  async listUserTokens(usuarioId: number): Promise<ExpoToken[]> {
    try {
      const token = await getToken();
      const response = await fetch(
        `https://ecobinapi.runasp.net/api/ExpoTokens/tokens/usuario/${usuarioId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return data.status ? data.dados : [];
    } catch (error) {
      console.error('[NotificationService] Erro ao listar tokens:', error);
      return [];
    }
  }

  async deactivateToken(tokenId: number): Promise<boolean> {
    try {
      const token = await getToken();
      const response = await fetch(
        `https://ecobinapi.runasp.net/api/ExpoTokens/token/${tokenId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('[NotificationService] Erro ao desativar token:', error);
      return false;
    }
  }

  // ==================== LISTAGEM DE NOTIFICAÇÕES ====================

  async listNotifications(usuarioId?: number): Promise<Notification[]> {
    try {
      const userId = usuarioId || this.currentUserId;
      if (!userId) {
        console.error('[NotificationService] ID do usuário não definido');
        return [];
      }

      const token = await getToken();
      const response = await fetch(
        `https://ecobinapi.runasp.net/api/ExpoTokens/notificacoes/usuario/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return data.status ? data.dados : [];
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

      const token = await getToken();
      const response = await fetch(
        `https://ecobinapi.runasp.net/api/ExpoTokens/notificacoes/usuario/${userId}/nao-lidas`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return data.status ? data.dados : [];
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

  // ==================== MARCAR COMO LIDA ====================

  async markAsRead(notificacaoId: number): Promise<boolean> {
    try {
      const token = await getToken();
      const response = await fetch(
        `https://ecobinapi.runasp.net/api/ExpoTokens/notificacoes/${notificacaoId}/marcar-lida`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return data.status;
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

      const token = await getToken();
      const response = await fetch(
        `https://ecobinapi.runasp.net/api/ExpoTokens/notificacoes/usuario/${userId}/marcar-todas-lidas`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('[NotificationService] Erro ao marcar todas como lidas:', error);
      return false;
    }
  }

  // ==================== ENVIO DE NOTIFICAÇÕES ====================

  async sendToUser(usuarioId: number, notification: CreateNotificationRequest): Promise<boolean> {
    try {
      const token = await getToken();
      const response = await fetch(
        `https://ecobinapi.runasp.net/api/ExpoTokens/notificacoes/enviar-usuario/${usuarioId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            titulo: notification.titulo,
            mensagem: notification.mensagem,
            dados: notification.dados ? JSON.stringify(notification.dados) : undefined,
          }),
        }
      );

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('[NotificationService] Erro ao enviar notificação:', error);
      return false;
    }
  }

  async sendToCondominium(request: SendToCondominiumRequest): Promise<{ success: boolean; count?: number }> {
    try {
      const token = await getToken();
      const response = await fetch(
        `https://ecobinapi.runasp.net/api/ExpoTokens/notificacoes/enviar-condominio/${request.condominioId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            titulo: request.titulo,
            mensagem: request.mensagem,
            dados: request.dados ? JSON.stringify(request.dados) : undefined,
          }),
        }
      );

      const data = await response.json();
      return {
        success: data.status,
        count: data.dados?.length,
      };
    } catch (error) {
      console.error('[NotificationService] Erro ao enviar para condomínio:', error);
      return { success: false };
    }
  }

  async sendToUserType(request: SendToTypeRequest): Promise<{ success: boolean; count?: number }> {
    try {
      const token = await getToken();
      const response = await fetch(
        'https://ecobinapi.runasp.net/api/ExpoTokens/notificacoes/enviar-condominio-tipo',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            condominioId: request.condominioId,
            tipoUsuario: request.tipoUsuario,
            titulo: request.titulo,
            mensagem: request.mensagem,
            dados: request.dados ? JSON.stringify(request.dados) : undefined,
          }),
        }
      );

      const data = await response.json();
      return {
        success: data.status,
        count: data.dados?.length,
      };
    } catch (error) {
      console.error('[NotificationService] Erro ao enviar para tipo de usuário:', error);
      return { success: false };
    }
  }
}

export const notificationService = new NotificationService();
