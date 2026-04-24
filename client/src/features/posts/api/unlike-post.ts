import { apiClient } from '@/services/api/client';

type UnlikePostResponse = {
  success: boolean;
  message: string;
  likesCount: number;
};

export async function unlikePost(postId: string) {
  const { data } = await apiClient.delete<UnlikePostResponse>(`/likes/post/${postId}`);
  return data;
}
