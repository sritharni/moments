import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/auth-context';
import { deletePost } from '@/features/posts/api/delete-post';
import { resolveMediaUrl } from '@/utils/resolve-media-url';
import { startConversation } from '@/features/chat/api/start-conversation';
import { followUser } from '@/features/users/api/follow-user';
import { getUserPosts } from '@/features/users/api/get-user-posts';
import { getUserProfile } from '@/features/users/api/get-user-profile';
import { unfollowUser } from '@/features/users/api/unfollow-user';
import type { Post } from '@/types/post';
import type { UserProfile } from '@/types/user';

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [postsRestricted, setPostsRestricted] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [isMessagePending, setIsMessagePending] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof userId !== 'string') {
      setErrorMessage('User not found.');
      setIsLoading(false);
      return;
    }

    const resolvedUserId = userId;

    async function loadProfilePage() {
      try {
        setIsLoading(true);
        setErrorMessage('');
        setPostsRestricted(false);

        const userProfile = await getUserProfile(resolvedUserId);
        setProfile(userProfile);

        try {
          const userPosts = await getUserPosts(resolvedUserId);
          setPosts(userPosts);
        } catch (error) {
          if (
            error instanceof AxiosError &&
            error.response?.status === 403
          ) {
            setPosts([]);
            setPostsRestricted(true);
            return;
          }

          throw error;
        }
      } catch (error) {
        const message =
          error instanceof AxiosError
            ? (error.response?.data?.message ?? 'Failed to load profile.')
            : 'Failed to load profile.';

        setErrorMessage(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfilePage();
  }, [userId]);

  async function handleFollowToggle() {
    if (!profile || profile.isOwnProfile) return;

    setIsFollowPending(true);
    setErrorMessage('');

    try {
      if (profile.isFollowing) {
        await unfollowUser(profile.id);
        setProfile((current) =>
          current
            ? {
                ...current,
                isFollowing: false,
                _count: { ...current._count, followers: Math.max(0, current._count.followers - 1) },
              }
            : current,
        );
        setPosts([]);
        setPostsRestricted(true);
      } else if (!profile.hasRequestedFollow) {
        await followUser(profile.id);
        setProfile((current) =>
          current ? { ...current, hasRequestedFollow: true } : current,
        );
        setPosts([]);
        setPostsRestricted(true);
      }
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Failed to update follow status.')
          : 'Failed to update follow status.';

      setErrorMessage(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsFollowPending(false);
    }
  }

  async function handleMessage() {
    if (!profile || profile.isOwnProfile) return;

    setIsMessagePending(true);
    try {
      const conversation = await startConversation(profile.id);
      navigate('/chat', { state: { conversationId: conversation.id } });
    } catch {
      setErrorMessage('Could not start conversation.');
    } finally {
      setIsMessagePending(false);
    }
  }

  async function handleDeletePost(post: Post) {
    if (deletingPostId === post.id) return;

    const confirmed = window.confirm('Delete this post permanently?');
    if (!confirmed) return;

    try {
      setDeletingPostId(post.id);
      setErrorMessage('');
      await deletePost(post.id);
      setPosts((current) => current.filter((currentPost) => currentPost.id !== post.id));
      setProfile((current) =>
        current
          ? {
              ...current,
              _count: {
                ...current._count,
                posts: Math.max(0, current._count.posts - 1),
              },
            }
          : current,
      );
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Failed to delete post.')
          : 'Failed to delete post.';
      setErrorMessage(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setDeletingPostId(null);
    }
  }

  function followButtonLabel() {
    if (isFollowPending) return 'Updating...';
    if (profile?.isFollowing) return 'Unfollow';
    if (profile?.hasRequestedFollow) return 'Requested';
    return 'Follow';
  }

  if (isLoading) {
    return (
      <section className="page-card">
        <p className="body-copy">Loading profile...</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="page-card">
        <div className="status-banner status-banner--error">
          {errorMessage || 'Profile not found.'}
        </div>
      </section>
    );
  }

  return (
    <section className="page-card">
      <div className="section-heading">
        <p className="eyebrow">Profile</p>
        <h2>@{profile.username}</h2>
      </div>

      {errorMessage ? (
        <div className="status-banner status-banner--error">{errorMessage}</div>
      ) : null}

      <div className="profile-card">
        <div className="profile-card__main">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {profile.profileImage ? (
                <img
                  src={resolveMediaUrl(profile.profileImage)}
                  alt={`${profile.username} avatar`}
                />
              ) : (
                <span>{profile.username.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
          </div>

          <div className="profile-copy">
            <p className="profile-copy__email">{profile.email}</p>
            <p className="profile-copy__bio">
              {profile.bio || 'This user has not added a bio yet.'}
            </p>
          </div>
        </div>

        <div className="profile-card__stats">
          <div className="profile-stat">
            <strong>{profile._count.posts}</strong>
            <span>Posts</span>
          </div>
          <div className="profile-stat">
            <strong>{profile._count.followers}</strong>
            <span>Followers</span>
          </div>
          <div className="profile-stat">
            <strong>{profile._count.following}</strong>
            <span>Following</span>
          </div>
        </div>

        {!profile.isOwnProfile ? (
          <div className="profile-actions">
            <button
              className={`follow-button${profile.isFollowing ? ' follow-button--active' : ''}${profile.hasRequestedFollow ? ' follow-button--requested' : ''}${
                isFollowPending ? ' follow-button--transitioning' : ''
              }`}
              type="button"
              disabled={isFollowPending || profile.hasRequestedFollow}
              aria-busy={isFollowPending}
              onClick={() => void handleFollowToggle()}
            >
              {followButtonLabel()}
            </button>
            <button
              className="message-button"
              type="button"
              disabled={isMessagePending}
              onClick={() => void handleMessage()}
            >
              {isMessagePending ? 'Opening...' : 'Send message'}
            </button>
          </div>
        ) : null}
      </div>

      <div className="section-heading profile-posts-heading">
        <p className="eyebrow">Posts</p>
        <h2>{profile.username}&apos;s posts</h2>
      </div>

      {posts.length === 0 ? (
        <div className="info-panel">
          <h3>{postsRestricted ? 'Posts are private' : 'No posts yet'}</h3>
          <p>
            {postsRestricted
              ? 'Follow this account to view their posts.'
              : 'This user has not shared any posts yet.'}
          </p>
        </div>
      ) : (
        <div className="feed-list">
          {posts.map((post) => (
            <article className="feed-card" key={post.id}>
              <header className="feed-card__header">
                <div>
                  <p className="feed-card__author">@{post.author.username}</p>
                  <p className="feed-card__date">
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
                {user?.id === post.author.id ? (
                  <button
                    className="feed-card__delete"
                    type="button"
                    aria-label="Delete post"
                    title="Delete post"
                    disabled={deletingPostId === post.id}
                    onClick={() => void handleDeletePost(post)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M9 3.75h6m-9 3h12m-9.75 0v11.25a1.5 1.5 0 0 0 1.5 1.5h4.5a1.5 1.5 0 0 0 1.5-1.5V6.75M10.5 10.5v5.25m3-5.25v5.25"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </button>
                ) : null}
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
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
