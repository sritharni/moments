import { apiClient } from '@/services/api/client';

export async function deleteMessage(messageId: string) {
  await apiClient.delete(`/messages/${messageId}`);
}
