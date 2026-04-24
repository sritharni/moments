export type NotificationType = 'NEW_MESSAGE' | 'FOLLOW_REQUEST' | 'FOLLOW_ACCEPTED';

export type Notification = {
  id: string;
  type: NotificationType;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    profileImage: string | null;
  };
};
