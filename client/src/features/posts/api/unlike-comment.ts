import { apiClient } from '@/services/api/client';

export async function unlikeComment(commentId: string) {
  const { data } = await apiClient.delete<{ success: boolean; likesCount: number }>(
    `/likes/comment/${commentId}`,
  );
  return data;
}
