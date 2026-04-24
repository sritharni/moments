import { apiClient } from '@/services/api/client';
import type { FollowerUser } from '@/types/user';

export async function getFollowers(userId: string): Promise<FollowerUser[]> {
  const { data } = await apiClient.get<FollowerUser[]>(`/users/${userId}/followers`);
  return data;
}
