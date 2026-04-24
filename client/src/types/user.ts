export type UserProfile = {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  profileImage: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  isOwnProfile: boolean;
  isFollowing: boolean;
  hasRequestedFollow: boolean;
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
};

export type UserSearchResult = {
  id: string;
  username: string;
  profileImage: string | null;
  bio: string | null;
};

export type FollowerUser = {
  id: string;
  username: string;
  profileImage: string | null;
};

export type FollowRequestItem = {
  id: string;
  createdAt: string;
  requester: {
    id: string;
    username: string;
    profileImage: string | null;
  };
};
