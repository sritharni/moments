import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/auth-context';
import { resolveMediaUrl } from '@/utils/resolve-media-url';
import { startConversation } from '@/features/chat/api/start-conversation';
import { deleteAccount } from '@/features/users/api/delete-account';
import { followUser } from '@/features/users/api/follow-user';
import { getUserPosts } from '@/features/users/api/get-user-posts';
import { getUserProfile } from '@/features/users/api/get-user-profile';
import { unfollowUser } from '@/features/users/api/unfollow-user';
import type { Post } from '@/types/post';
import type { UserProfile } from '@/types/user';

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [postsRestricted, setPostsRestricted] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [isMessagePending, setIsMessagePending] = useState(false);
  const [isDeleteAccountPending, setIsDeleteAccountPending] = useState(false);

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

  async function handleDeleteAccount() {
    if (!profile?.isOwnProfile || isDeleteAccountPending) return;

    const confirmed = window.confirm(
      'Delete your account permanently? This will remove your profile, posts, comments, likes, messages, and conversations.',
    );

    if (!confirmed) return;

    setIsDeleteAccountPending(true);
    setErrorMessage('');

    try {
      await deleteAccount();
      logout();
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Failed to delete account.')
          : 'Failed to delete account.';

      setErrorMessage(Array.isArray(message) ? message.join(', ') : message);
      setIsDeleteAccountPending(false);
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
          <div className="profile-avatar">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt={`${profile.username} avatar`} />
            ) : (
              <span>{profile.username.slice(0, 1).toUpperCase()}</span>
            )}
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
              className={`follow-button${profile.isFollowing ? ' follow-button--active' : ''}${profile.hasRequestedFollow ? ' follow-button--requested' : ''}`}
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
        ) : (
          <div className="profile-actions">
            <button
              className="delete-account-button"
              type="button"
              disabled={isDeleteAccountPending}
              onClick={() => void handleDeleteAccount()}
            >
              {isDeleteAccountPending ? 'Deleting...' : 'Delete account'}
            </button>
          </div>
        )}
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
