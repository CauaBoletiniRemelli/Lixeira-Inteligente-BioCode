import { api } from './api';

export type NotificationType = 'alert' | 'warning' | 'info';

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  read: boolean;
  sensorId?: string;
  sensorName?: string;
  createdAt: string;
  readAt?: string;
}

export interface CreateNotificationRequest {
  userId: string;
  message: string;
  type: NotificationType;
  sensorId?: string;
}

export const notificationService = {
  /**
   * Busca todas as notificações do usuário logado
   */
  getAll: async (): Promise<Notification[]> => {
    return api.get<Notification[]>('/notifications');
  },

  /**
   * Busca notificações não lidas
   */
  getUnread: async (): Promise<Notification[]> => {
    return api.get<Notification[]>('/notifications/unread');
  },

  /**
   * Marca uma notificação como lida
   */
  markAsRead: async (id: string): Promise<Notification> => {
    return api.patch<Notification>(`/notifications/${id}/read`);
  },

  /**
   * Marca todas as notificações como lidas
   */
  markAllAsRead: async (): Promise<{ message: string }> => {
    return api.patch('/notifications/read-all');
  },

  /**
   * Deleta uma notificação
   */
  delete: async (id: string): Promise<void> => {
    return api.delete(`/notifications/${id}`);
  },

  /**
   * Deleta todas as notificações lidas
   */
  deleteAllRead: async (): Promise<{ message: string }> => {
    return api.delete('/notifications/read');
  },

  /**
   * Cria uma notificação (admin)
   */
  create: async (data: CreateNotificationRequest): Promise<Notification> => {
    return api.post<Notification>('/notifications', data);
  },

  /**
   * Conta notificações não lidas
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    return api.get('/notifications/unread/count');
  },
};
