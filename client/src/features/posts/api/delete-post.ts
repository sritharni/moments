import { apiClient } from '@/services/api/client';

export async function deletePost(postId: string) {
  const { data } = await apiClient.delete<{ success: boolean; message: string }>(`/posts/${postId}`);
  return data;
}
