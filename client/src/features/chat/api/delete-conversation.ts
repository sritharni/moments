import { apiClient } from '@/services/api/client';

export async function deleteConversation(conversationId: string) {
  await apiClient.delete(`/conversations/${conversationId}`);
}
