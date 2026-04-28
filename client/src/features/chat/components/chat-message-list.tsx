import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/types/chat';

type ChatMessageListProps = {
  conversationId: string;
  currentUserId: string;
  messages: ChatMessage[];
  onDeleteMessage: (messageId: string) => void | Promise<void>;
};

const NEAR_BOTTOM_THRESHOLD_PX = 80;

export function ChatMessageList({
  conversationId,
  currentUserId,
  messages,
  onDeleteMessage,
}: ChatMessageListProps) {
  const threadRef = useRef<HTMLDivElement>(null);
  const wasNearBottomRef = useRef(true);
  const [deletingId, setDeletingId] = useState('');

  useLayoutEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;
    thread.scrollTop = thread.scrollHeight;
    wasNearBottomRef.current = true;
  }, [conversationId]);

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;
    if (!wasNearBottomRef.current) return;
    thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  function handleScroll() {
    const thread = threadRef.current;
    if (!thread) return;
    const distanceFromBottom =
      thread.scrollHeight - thread.scrollTop - thread.clientHeight;
    wasNearBottomRef.current = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD_PX;
  }

  async function handleDelete(messageId: string) {
    if (deletingId) return;
    const confirmed = window.confirm('Delete this message for everyone?');
    if (!confirmed) return;
    setDeletingId(messageId);
    try {
      await onDeleteMessage(messageId);
    } finally {
      setDeletingId('');
    }
  }

  return (
    <div ref={threadRef} className="chat-thread" onScroll={handleScroll}>
      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId;
        const isDeleting = deletingId === message.id;

        return (
          <div
            key={message.id}
            className={`chat-bubble-row${
              isOwnMessage ? ' chat-bubble-row--self' : ''
            }${
              isOwnMessage ? ' chat-bubble-row--outgoing' : ' chat-bubble-row--incoming'
            }`}
          >
            <div
              className={`chat-bubble${
                isOwnMessage ? ' chat-bubble--self' : ''
              }`}
            >
              <button
                type="button"
                className="chat-bubble__delete"
                onClick={() => handleDelete(message.id)}
                disabled={isDeleting}
                aria-label="Delete message"
                title="Delete message"
              >
                {isDeleting ? '…' : '×'}
              </button>
              <p className="chat-bubble__author">{message.senderName}</p>
              <p className="chat-bubble__content">{message.content}</p>
              <span className="chat-bubble__time">{message.time}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
