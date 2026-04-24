import type { ChatConversation } from '@/types/chat';

type ChatConversationListProps = {
  conversations: ChatConversation[];
  activeConversationId: string;
  onSelect: (conversationId: string) => void;
};

export function ChatConversationList({
  conversations,
  activeConversationId,
  onSelect,
}: ChatConversationListProps) {
  return (
    <div className="chat-sidebar__list">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          type="button"
          className={`chat-conversation-item${
            conversation.id === activeConversationId
              ? ' chat-conversation-item--active'
              : ''
          }`}
          onClick={() => onSelect(conversation.id)}
        >
          <div className="chat-conversation-item__avatar">
            {conversation.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="chat-conversation-item__copy">
            <strong>{conversation.name}</strong>
            <span>{conversation.preview}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
