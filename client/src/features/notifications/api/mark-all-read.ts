import { apiClient } from '@/services/api/client';

export async function markAllNotificationsRead() {
  await apiClient.patch('/notifications/read-all');
}
