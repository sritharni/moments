import { apiClient } from '@/services/api/client';

type FollowUserResponse = {
  success: boolean;
  message: string;
};

export async function followUser(userId: string) {
  const { data } = await apiClient.post<FollowUserResponse>(`/users/${userId}/follow`);
  return data;
}
