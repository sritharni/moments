import { apiClient } from '@/services/api/client';
import type { Comment } from '@/types/post';

type AddCommentResponse = Omit<Comment, 'isLiked' | '_count'>;

export async function addComment(postId: string, content: string) {
  const { data } = await apiClient.post<AddCommentResponse>(`/comments/post/${postId}`, { content });
  return data;
}
