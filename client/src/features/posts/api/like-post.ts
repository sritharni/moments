import { apiClient } from '@/services/api/client';

type LikePostResponse = {
  success: boolean;
  message: string;
  likesCount: number;
};

export async function likePost(postId: string) {
  const { data } = await apiClient.post<LikePostResponse>(`/likes/post/${postId}`);
  return data;
}
