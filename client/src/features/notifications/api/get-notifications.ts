import { apiClient } from '@/services/api/client';
import type { Notification } from '@/types/notification';

export async function getNotifications() {
  const { data } = await apiClient.get<Notification[]>('/notifications');
  return data;
}
