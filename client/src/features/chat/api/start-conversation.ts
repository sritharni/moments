import { apiClient } from '@/services/api/client';

export async function startConversation(userId: string): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>(
    `/conversations/direct/${userId}`,
  );
  return data;
}
