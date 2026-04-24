export type Post = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  isLiked: boolean;
  author: {
    id: string;
    username: string;
    profileImage: string | null;
  };
  _count: {
    comments: number;
    likes: number;
  };
};

export type Comment = {
  id: string;
  content: string;
  postId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isLiked: boolean;
  user: {
    id: string;
    username: string;
    profileImage: string | null;
  };
  _count: {
    commentLikes: number;
  };
};
