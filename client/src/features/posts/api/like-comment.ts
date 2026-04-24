import { apiClient } from '@/services/api/client';

export async function likeComment(commentId: string) {
  const { data } = await apiClient.post<{ success: boolean; likesCount: number }>(
    `/likes/comment/${commentId}`,
  );
  return data;
}
