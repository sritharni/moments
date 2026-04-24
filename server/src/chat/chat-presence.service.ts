import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatPresenceService {
  private readonly userSockets = new Map<string, Set<string>>();

  addConnection(userId: string, socketId: string) {
    const connections = this.userSockets.get(userId) ?? new Set<string>();
    connections.add(socketId);
    this.userSockets.set(userId, connections);
  }

  removeConnection(userId: string, socketId: string) {
    const connections = this.userSockets.get(userId);

    if (!connections) {
      return;
    }

    connections.delete(socketId);

    if (connections.size === 0) {
      this.userSockets.delete(userId);
    }
  }

  isOnline(userId: string) {
    return (this.userSockets.get(userId)?.size ?? 0) > 0;
  }
}
