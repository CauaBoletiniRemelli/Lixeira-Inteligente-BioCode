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
  getAll: async (): Promise<Notification[]> => {
    return api.get<Notification[]>('/notifications');
  },

  getUnread: async (): Promise<Notification[]> => {
    return api.get<Notification[]>('/notifications/unread');
  },

  markAsRead: async (id: string): Promise<Notification> => {
    return api.patch<Notification>(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    return api.patch('/notifications/read-all');
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/notifications/${id}`);
  },

  deleteAllRead: async (): Promise<{ message: string }> => {
    return api.delete('/notifications/read');
  },

  create: async (data: CreateNotificationRequest): Promise<Notification> => {
    return api.post<Notification>('/notifications', data);
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    return api.get('/notifications/unread/count');
  },
};
