import { Link } from 'react-router-dom';
import type { ChatConversation } from '@/types/chat';

type ChatConversationListProps = {
  conversations: ChatConversation[];
  activeConversationId: string;
  onSelect: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
  deletingConversationId: string;
};

export function ChatConversationList({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  deletingConversationId,
}: ChatConversationListProps) {
  return (
    <div className="chat-sidebar__list">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={`chat-conversation-item${
            conversation.id === activeConversationId
              ? ' chat-conversation-item--active'
              : ''
          }`}
        >
          <button
            type="button"
            className="chat-conversation-item__select"
            onClick={() => onSelect(conversation.id)}
          >
            <div className="chat-conversation-item__avatar">
              {conversation.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="chat-conversation-item__copy">
              {conversation.userId ? (
                <strong>
                  <Link
                    to={`/profile/${conversation.userId}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {conversation.name}
                  </Link>
                </strong>
              ) : (
                <strong>{conversation.name}</strong>
              )}
              <span>{conversation.preview}</span>
            </div>
          </button>

          <button
            type="button"
            className="chat-conversation-item__delete"
            onClick={() => onDelete(conversation.id)}
            disabled={deletingConversationId === conversation.id}
            aria-label={`Delete conversation with ${conversation.name}`}
          >
            {deletingConversationId === conversation.id ? '...' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  );
}
