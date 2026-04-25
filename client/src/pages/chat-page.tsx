import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChatComposer } from '@/features/chat/components/chat-composer';
import { ChatConversationList } from '@/features/chat/components/chat-conversation-list';
import { ChatMessageList } from '@/features/chat/components/chat-message-list';
import { deleteConversation } from '@/features/chat/api/delete-conversation';
import { getConversations } from '@/features/chat/api/get-conversations';
import { useChat } from '@/features/chat/hooks/use-chat';
import { getCurrentUser } from '@/features/auth/utils/decode-token';
import { useNotifications } from '@/features/notifications/context/notification-context';
import type { ApiConversation, ApiMessage, ChatConversation, ChatMessage } from '@/types/chat';

function toUiConversation(conv: ApiConversation, currentUserId: string): ChatConversation {
  const other = conv.participants.find((p) => p.user.id !== currentUserId);
  return {
    id: conv.id,
    userId: other?.user.id ?? '',
    name: other?.user.username ?? 'Unknown',
    preview: '',
  };
}

function toUiMessage(msg: ApiMessage): ChatMessage {
  return {
    id: msg.id,
    senderId: msg.senderId,
    senderName: msg.sender.username,
    content: msg.content,
    time: new Date(msg.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

export function ChatPage() {
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.sub ?? '';
  const { markChatRead } = useNotifications();

  useEffect(() => {
    markChatRead();
  }, [markChatRead]);

  const location = useLocation();
  const initialConversationId =
    (location.state as { conversationId?: string } | null)?.conversationId ?? '';

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState(initialConversationId);
  const [composerValue, setComposerValue] = useState('');
  const [deletingConversationId, setDeletingConversationId] = useState('');

  const { messages, loading, sendMessage, deleteMessage } = useChat(
    activeConversationId || null,
  );

  useEffect(() => {
    if (!currentUserId) return;

    getConversations()
      .then((data) => {
        const uiConversations = data.map((c) => toUiConversation(c, currentUserId));
        setConversations(uiConversations);
        if (uiConversations.length > 0) {
          setActiveConversationId((prev) => prev || uiConversations[0]!.id);
        }
      })
      .catch(() => {});
  }, [currentUserId]);

  function handleSend() {
    const content = composerValue.trim();
    if (!content) return;
    sendMessage(content);
    setComposerValue('');
  }

  async function handleDeleteConversation(conversationId: string) {
    setDeletingConversationId(conversationId);

    try {
      await deleteConversation(conversationId);
      setConversations((current) => {
        const next = current.filter((conversation) => conversation.id !== conversationId);

        setActiveConversationId((prev) =>
          prev === conversationId ? (next[0]?.id ?? '') : prev,
        );

        return next;
      });
    } catch {
      // Keep the current UI state if deletion fails.
    } finally {
      setDeletingConversationId('');
    }
  }

  const uiMessages = messages.map(toUiMessage);
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <section className="chat-layout">
      <aside className="chat-sidebar">
        <div className="chat-sidebar__header">
          <p className="eyebrow">Messages</p>
          <h2>Conversations</h2>
        </div>

        <ChatConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={setActiveConversationId}
          onDelete={handleDeleteConversation}
          deletingConversationId={deletingConversationId}
        />
      </aside>

      <div className="chat-panel">
        <header className="chat-panel__header">
          <div>
            <p className="eyebrow">1:1 Chat</p>
            {activeConversation?.userId ? (
              <h2>
                <Link to={`/profile/${activeConversation.userId}`}>
                  {activeConversation.name}
                </Link>
              </h2>
            ) : (
              <h2>{activeConversation?.name ?? 'Select a conversation'}</h2>
            )}
          </div>
        </header>

        {loading ? (
          <div className="chat-thread" />
        ) : (
          <ChatMessageList
            conversationId={activeConversationId}
            currentUserId={currentUserId}
            messages={uiMessages}
            onDeleteMessage={deleteMessage}
          />
        )}

        <ChatComposer
          value={composerValue}
          onChange={setComposerValue}
          onSend={handleSend}
        />
      </div>
    </section>
  );
}
