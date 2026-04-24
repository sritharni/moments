import { apiClient } from '@/services/api/client';
import type { AuthResponse, SignupInput } from '@/types/auth';

export async function signup(input: SignupInput) {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', input);
  return data;
}
