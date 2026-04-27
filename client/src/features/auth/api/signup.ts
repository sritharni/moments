import { apiClient } from '@/services/api/client';
import type { SignupInput, SignupResponse } from '@/types/auth';

export async function signup(input: SignupInput) {
  const { data } = await apiClient.post<SignupResponse>('/auth/register', input);
  return data;
}
