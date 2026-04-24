import { apiClient } from '@/services/api/client';
import type { Post } from '@/types/post';

export type CreatePostInput = {
  content: string;
  imageUrl?: string;
};

export async function createPost(input: CreatePostInput) {
  const { data } = await apiClient.post<Post>('/posts', input);
  return data;
}
