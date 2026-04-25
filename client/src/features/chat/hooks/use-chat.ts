import { useCallback, useEffect, useRef, useState } from 'react';
import { connectSocket, disconnectSocket, socket } from '@/services/socket/client';
import type { ApiMessage } from '@/types/chat';
import { deleteMessage as deleteMessageRequest } from '../api/delete-message';
import { getMessages } from '../api/get-messages';

export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const activeIdRef = useRef<string | null>(null);

  // Connect socket on mount, disconnect on unmount
  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  // When conversationId changes: fetch history + join room
  useEffect(() => {
    if (!conversationId) return;

    activeIdRef.current = conversationId;
    setMessages([]);
    setLoading(true);

    getMessages(conversationId)
      .then((msgs) => {
        if (activeIdRef.current !== conversationId) return;
        setMessages((prev) => {
          // Merge fetched history with any socket messages that arrived during the fetch.
          // History is the source of truth for IDs; socket-only messages are appended.
          const byId = new Map(msgs.map((m) => [m.id, m]));
          for (const m of prev) {
            if (!byId.has(m.id)) byId.set(m.id, m);
          }
          return Array.from(byId.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        });
      })
      .catch(() => {})
      .finally(() => {
        if (activeIdRef.current === conversationId) {
          setLoading(false);
        }
      });

    function joinRoom() {
      socket.emit('chat:join', { conversationId: conversationId! });
    }

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
    }

    return () => {
      socket.off('connect', joinRoom);
    };
  }, [conversationId]);

  // Listen for incoming messages (set up once, filter by active conversation)
  useEffect(() => {
    function handleMessage(message: ApiMessage) {
      if (message.conversationId !== activeIdRef.current) return;
      setMessages((prev) => {
        // Deduplicate — server broadcasts to both conversation room and user room
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }

    function handleDeleted(payload: { id: string; conversationId: string }) {
      if (payload.conversationId !== activeIdRef.current) return;
      setMessages((prev) => prev.filter((m) => m.id !== payload.id));
    }

    socket.on('chat:message', handleMessage);
    socket.on('chat:message-deleted', handleDeleted);
    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:message-deleted', handleDeleted);
    };
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!conversationId || !content.trim()) return;
      socket.emit('chat:send', { conversationId, content: content.trim() });
    },
    [conversationId],
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      await deleteMessageRequest(messageId);
    } catch {
      // If the request fails, refetch to restore state
      const id = activeIdRef.current;
      if (!id) return;
      const msgs = await getMessages(id);
      if (activeIdRef.current === id) setMessages(msgs);
    }
  }, []);

  return { messages, loading, sendMessage, deleteMessage };
}
