import { apiClient } from '@/services/api/client';
import type { Post } from '@/types/post';

export async function getUserPosts(userId: string) {
  const { data } = await apiClient.get<Post[]>(`/posts/user/${userId}`);
  return data;
}
