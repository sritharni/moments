import { apiClient } from '@/services/api/client';

type UnfollowUserResponse = {
  success: boolean;
  message: string;
};

export async function unfollowUser(userId: string) {
  const { data } = await apiClient.post<UnfollowUserResponse>(`/users/${userId}/unfollow`);
  return data;
}
