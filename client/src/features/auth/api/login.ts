import { apiClient } from '@/services/api/client';
import type { AuthResponse, LoginInput } from '@/types/auth';

export async function login(input: LoginInput) {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', input);
  return data;
}
