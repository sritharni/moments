import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreatePostForm } from '@/features/posts/components/create-post-form';
import { PostComments } from '@/features/posts/components/post-comments';
import { getFeed } from '@/features/posts/api/get-feed';
import { likePost } from '@/features/posts/api/like-post';
import { unlikePost } from '@/features/posts/api/unlike-post';
import { resolveMediaUrl } from '@/utils/resolve-media-url';
import type { Post } from '@/types/post';

export function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingPostId, setPendingPostId] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeed() {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const data = await getFeed();
        setPosts(data);
      } catch (error) {
        const message =
          error instanceof AxiosError
            ? (error.response?.data?.message ?? 'Failed to load feed.')
            : 'Failed to load feed.';
        setErrorMessage(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadFeed();
  }, []);

  async function handleToggleLike(post: Post) {
    if (pendingPostId === post.id) return;
    try {
      setPendingPostId(post.id);
      setErrorMessage('');
      const response = post.isLiked ? await unlikePost(post.id) : await likePost(post.id);
      setPosts((current) =>
        current.map((p) =>
          p.id === post.id
            ? { ...p, isLiked: !post.isLiked, _count: { ...p._count, likes: response.likesCount } }
            : p,
        ),
      );
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Failed to update like.')
          : 'Failed to update like.';
      setErrorMessage(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setPendingPostId(null);
    }
  }

  function handleCommentCountChange(postId: string, delta: number) {
    setPosts((current) =>
      current.map((p) =>
        p.id === postId
          ? { ...p, _count: { ...p._count, comments: p._count.comments + delta } }
          : p,
      ),
    );
  }

  return (
    <section className="page-card">
      <div className="section-heading">
        <p className="eyebrow">Following feed</p>
        <h2>Latest posts from people you follow</h2>
      </div>

      <CreatePostForm
        onPostCreated={(post) =>
          setPosts((current) => [{ ...post, isLiked: false }, ...current])
        }
      />

      {errorMessage ? (
        <div className="status-banner status-banner--error">{errorMessage}</div>
      ) : null}

      {isLoading ? <p className="body-copy">Loading feed...</p> : null}

      {!isLoading && posts.length === 0 ? (
        <div className="info-panel">
          <h3>No posts yet</h3>
          <p>Follow some users and create posts to populate this feed.</p>
        </div>
      ) : null}

      <div className="feed-list">
        {posts.map((post) => (
          <article className="feed-card" key={post.id}>
            <header className="feed-card__header">
              <div>
                <Link className="feed-card__author" to={`/profile/${post.author.id}`}>
                  @{post.author.username}
                </Link>
                <p className="feed-card__date">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            </header>

            <p className="feed-card__content">{post.content}</p>

            {post.imageUrl ? (
              <img
                className="feed-card__image"
                src={resolveMediaUrl(post.imageUrl)}
                alt="Post image"
              />
            ) : null}

            <div className="feed-card__meta">
              <span>{post._count.likes} likes</span>
              <span>{post._count.comments} comments</span>
            </div>

            <div className="feed-card__actions">
              <button
                className={`like-button${post.isLiked ? ' like-button--active' : ''}`}
                type="button"
                disabled={pendingPostId === post.id}
                onClick={() => void handleToggleLike(post)}
              >
                {pendingPostId === post.id
                  ? '...'
                  : post.isLiked
                    ? '♥ Liked'
                    : '♡ Like'}
              </button>
            </div>

            <PostComments
              postId={post.id}
              commentCount={post._count.comments}
              onCommentCountChange={(delta) => handleCommentCountChange(post.id, delta)}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
