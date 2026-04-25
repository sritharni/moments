import { apiClient } from '@/services/api/client';

export async function deleteAccount() {
  await apiClient.delete('/users/me');
}
