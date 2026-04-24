import { apiClient } from '@/services/api/client';
import type { UserSearchResult } from '@/types/user';

export async function searchUsers(q: string): Promise<UserSearchResult[]> {
  const { data } = await apiClient.get<UserSearchResult[]>('/users/search', {
    params: { q },
  });
  return data;
}
