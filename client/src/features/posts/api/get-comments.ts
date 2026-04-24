import { apiClient } from '@/services/api/client';
import type { Comment } from '@/types/post';

export async function getComments(postId: string) {
  const { data } = await apiClient.get<Comment[]>(`/comments/post/${postId}`);
  return data;
}
