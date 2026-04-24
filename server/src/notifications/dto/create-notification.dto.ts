import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  userId!: string;
  type!: NotificationType;
  actorId!: string;
  referenceId?: string;
}
