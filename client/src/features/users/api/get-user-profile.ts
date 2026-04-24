import { apiClient } from '@/services/api/client';
import type { UserProfile } from '@/types/user';

export async function getUserProfile(userId: string) {
  const { data } = await apiClient.get<UserProfile>(`/users/${userId}`);
  return data;
}
