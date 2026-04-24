import { apiClient } from '@/services/api/client';
import type { ApiMessage } from '@/types/chat';

type MessagesResponse = {
  items: ApiMessage[];
  pageInfo: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
};

export async function getMessages(conversationId: string): Promise<ApiMessage[]> {
  const response = await apiClient.get<MessagesResponse>(
    `/messages/conversation/${conversationId}`,
    { params: { limit: 50 } },
  );
  // API returns newest-first; reverse so oldest is at the top
  return response.data.items.slice().reverse();
}
