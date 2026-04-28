import { AxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { addComment } from '../api/add-comment';
import { deleteComment } from '../api/delete-comment';
import { getComments } from '../api/get-comments';
import { likeComment } from '../api/like-comment';
import { unlikeComment } from '../api/unlike-comment';
import type { Comment } from '@/types/post';

type Props = {
  postId: string;
  commentCount: number;
  onCommentCountChange: (delta: number) => void;
};

export function PostComments({ postId, commentCount, onCommentCountChange }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingLike, setPendingLike] = useState<string | null>(null);
  const [freshCommentId, setFreshCommentId] = useState<string | null>(null);
  const [justLikedCommentId, setJustLikedCommentId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open || loaded) return;

    async function load() {
      try {
        const data = await getComments(postId);
        setComments(data);
        setLoaded(true);
      } catch {
        setError('Failed to load comments.');
      }
    }

    void load();
  }, [open, loaded, postId]);

  async function handleAdd() {
    const content = newText.trim();
    if (!content || submitting) return;

    try {
      setSubmitting(true);
      setError('');
      const comment = await addComment(postId, content);
      setComments((prev) => [
        ...prev,
        { ...comment, isLiked: false, _count: { commentLikes: 0 } },
      ]);
      setFreshCommentId(comment.id);
      window.setTimeout(() => setFreshCommentId(null), 720);
      onCommentCountChange(1);
      setNewText('');
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? 'Failed to add comment.')
          : 'Failed to add comment.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      setError('');
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentCountChange(-1);
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? 'Failed to delete comment.')
          : 'Failed to delete comment.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  }

  async function handleCommentLike(commentId: string, isLiked: boolean) {
    if (pendingLike === commentId) return;
    try {
      setPendingLike(commentId);
      setError('');
      const res = isLiked ? await unlikeComment(commentId) : await likeComment(commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, isLiked: !isLiked, _count: { commentLikes: res.likesCount } }
            : c,
        ),
      );
      if (!isLiked) {
        setJustLikedCommentId(commentId);
        window.setTimeout(() => setJustLikedCommentId(null), 620);
      }
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? 'Failed to update like.')
          : 'Failed to update like.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setPendingLike(null);
    }
  }

  return (
    <div className="post-comments">
      <button
        className="comments-toggle"
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide' : 'View'} comments ({commentCount})
      </button>

      {open && (
        <div className="comments-section comments-section--open">
          {error ? <p className="comments-error">{error}</p> : null}

          {!loaded ? (
            <p className="comments-loading">Loading...</p>
          ) : comments.length === 0 ? (
            <p className="comments-empty">No comments yet. Be the first!</p>
          ) : (
            <ul className="comments-list">
              {comments.map((comment) => (
                <li
                  className={`comment-item${
                    freshCommentId === comment.id ? ' comment-item--fresh' : ''
                  }`}
                  key={comment.id}
                >
                  <div className="comment-item__header">
                    <span className="comment-item__author">@{comment.user.username}</span>
                    <span className="comment-item__date">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="comment-item__content">{comment.content}</p>
                  <div className="comment-item__actions">
                    <button
                      className={`comment-like-btn${comment.isLiked ? ' comment-like-btn--active' : ''}${
                        justLikedCommentId === comment.id ? ' comment-like-btn--burst' : ''
                      }`}
                      type="button"
                      disabled={pendingLike === comment.id}
                      onClick={() => void handleCommentLike(comment.id, comment.isLiked)}
                    >
                      {comment.isLiked ? '♥' : '♡'} {comment._count.commentLikes}
                    </button>
                    {user?.id === comment.userId && (
                      <button
                        className="comment-delete-btn"
                        type="button"
                        onClick={() => void handleDelete(comment.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="comment-composer">
            <textarea
              ref={inputRef}
              className="comment-composer__input"
              placeholder="Write a comment..."
              rows={2}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleAdd();
                }
              }}
            />
            <button
              className="comment-composer__submit"
              type="button"
              disabled={!newText.trim() || submitting}
              onClick={() => void handleAdd()}
            >
              {submitting ? '...' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
