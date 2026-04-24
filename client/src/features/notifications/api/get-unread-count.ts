import { apiClient } from '@/services/api/client';

export async function getUnreadCount() {
  const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}
