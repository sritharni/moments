import { apiClient } from '@/services/api/client';

export async function requestPasswordReset(email: string) {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string) {
  await apiClient.post('/auth/reset-password', { token, password });
}
