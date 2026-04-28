import { apiClient } from '@/services/api/client';
import type { UserProfile } from '@/types/user';

type UpdateProfileInput = {
  username?: string;
  bio?: string;
  profileImage?: string;
};

export async function updateProfile(input: UpdateProfileInput) {
  const { data } = await apiClient.patch<UserProfile>('/users/me', input);
  return data;
}
