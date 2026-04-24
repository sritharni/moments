import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types/chat';

type ChatMessageListProps = {
  currentUserId: string;
  messages: ChatMessage[];
};

export function ChatMessageList({
  currentUserId,
  messages,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-thread">
      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId;

        return (
          <div
            key={message.id}
            className={`chat-bubble-row${
              isOwnMessage ? ' chat-bubble-row--self' : ''
            }`}
          >
            <div
              className={`chat-bubble${
                isOwnMessage ? ' chat-bubble--self' : ''
              }`}
            >
              <p className="chat-bubble__author">{message.senderName}</p>
              <p className="chat-bubble__content">{message.content}</p>
              <span className="chat-bubble__time">{message.time}</span>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
