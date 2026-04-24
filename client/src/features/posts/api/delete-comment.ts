import { apiClient } from '@/services/api/client';

export async function deleteComment(commentId: string) {
  const { data } = await apiClient.delete<{ success: boolean; message: string }>(
    `/comments/${commentId}`,
  );
  return data;
}
