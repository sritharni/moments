export type ChatConversation = {
  id: string;
  userId: string;
  name: string;
  preview: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  time: string;
};

export type ApiMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    username: string;
    profileImage: string | null;
  };
};

export type ApiConversation = {
  id: string;
  type: 'DIRECT';
  directKey: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  participants: Array<{
    user: {
      id: string;
      username: string;
      profileImage: string | null;
    };
  }>;
  _count: { messages: number };
};
