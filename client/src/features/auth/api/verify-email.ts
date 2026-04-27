import { apiClient } from '@/services/api/client';
import type { AuthResponse, VerifyEmailInput } from '@/types/auth';

export async function verifyEmail(input: VerifyEmailInput) {
  const { data } = await apiClient.post<AuthResponse>('/auth/verify-email', input);
  return data;
}

export async function resendVerification(email: string) {
  await apiClient.post('/auth/resend-verification', { email });
}
