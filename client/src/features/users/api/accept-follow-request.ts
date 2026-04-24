import { apiClient } from '@/services/api/client';

export async function acceptFollowRequest(requestId: string) {
  const { data } = await apiClient.post(`/users/follow-requests/${requestId}/accept`);
  return data;
}
