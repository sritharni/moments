import { apiClient } from '@/services/api/client';

export async function rejectFollowRequest(requestId: string) {
  const { data } = await apiClient.post(`/users/follow-requests/${requestId}/reject`);
  return data;
}
