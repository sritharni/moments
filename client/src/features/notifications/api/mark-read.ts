import { apiClient } from '@/services/api/client';

export async function markNotificationRead(id: string) {
  await apiClient.patch(`/notifications/${id}/read`);
}
