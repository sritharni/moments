import { apiClient } from '@/services/api/client';
import type { Post } from '@/types/post';

export async function getFeed() {
  const { data } = await apiClient.get<Post[]>('/posts');
  return data;
}
