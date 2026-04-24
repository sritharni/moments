import { apiClient } from '@/services/api/client';
import type { FollowRequestItem } from '@/types/user';

export async function getFollowRequests(): Promise<FollowRequestItem[]> {
  const { data } = await apiClient.get<FollowRequestItem[]>('/users/me/follow-requests');
  return data;
}
