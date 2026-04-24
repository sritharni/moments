import { apiClient } from '@/services/api/client';
import type { ApiConversation } from '@/types/chat';

export async function getConversations(): Promise<ApiConversation[]> {
  const response = await apiClient.get<ApiConversation[]>('/conversations');
  return response.data;
}
