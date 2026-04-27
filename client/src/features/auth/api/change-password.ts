import { apiClient } from '@/services/api/client';

export async function changePassword(currentPassword: string, newPassword: string) {
  await apiClient.post('/auth/change-password', { currentPassword, newPassword });
}
