import { AxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { resolveMediaUrl } from '@/utils/resolve-media-url';
import { changePassword } from '@/features/auth/api/change-password';
import { deleteAccount } from '@/features/users/api/delete-account';
import { getUserProfile } from '@/features/users/api/get-user-profile';
import { updateProfile } from '@/features/users/api/update-profile';
import { uploadImage } from '@/features/posts/api/upload-image';
import type { UserProfile } from '@/types/user';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleteAccountPending, setIsDeleteAccountPending] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [bioError, setBioError] = useState('');
  const [isBioSaving, setIsBioSaving] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwInfo, setPwInfo] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwNewFocused, setPwNewFocused] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;

    async function loadSettings() {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const currentProfile = await getUserProfile(user?.id ?? '');
        setProfile(currentProfile);
        setBioDraft(currentProfile.bio ?? '');
      } catch (error) {
        const message =
          error instanceof AxiosError
            ? (error.response?.data?.message ?? 'Failed to load settings.')
            : 'Failed to load settings.';
        setErrorMessage(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadSettings();
  }, [user?.id]);

  async function handleSaveBio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || isBioSaving) return;

    const nextBio = bioDraft.trim();
    setBioError('');
    setErrorMessage('');

    if (nextBio.length > 280) {
      setBioError('Bio must be 280 characters or fewer.');
      return;
    }

    setIsBioSaving(true);

    try {
      const updatedProfile = await updateProfile({ bio: nextBio });
      setProfile((current) =>
        current ? { ...current, ...updatedProfile, _count: current._count } : current,
      );
      setBioDraft(updatedProfile.bio ?? '');
      setIsEditingBio(false);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Failed to update bio.')
          : 'Failed to update bio.';
      setBioError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsBioSaving(false);
    }
  }

  async function handleProfileImageChange(file: File | undefined) {
    if (!file || !profile || isAvatarUploading) return;

    setAvatarError('');
    setErrorMessage('');
    setIsAvatarUploading(true);

    try {
      const profileImage = await uploadImage(file);
      const updatedProfile = await updateProfile({ profileImage });
      setProfile((current) =>
        current ? { ...current, ...updatedProfile, _count: current._count } : current,
      );
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Failed to update profile picture.')
          : 'Failed to update profile picture.';
      setAvatarError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  }

  async function handleDeleteAccount() {
    if (!profile || isDeleteAccountPending) return;

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

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPwError('');
    setPwInfo('');

    const rules = [
      pwNew.length >= 8,
      /[A-Z]/.test(pwNew),
      /[a-z]/.test(pwNew),
      /\d/.test(pwNew),
      /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(pwNew),
    ];

    if (!pwCurrent) {
      setPwError('Enter your current password.');
      return;
    }
    if (!rules.every(Boolean)) {
      setPwError('New password does not meet the requirements.');
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwNew === pwCurrent) {
      setPwError('New password must be different from the current password.');
      return;
    }

    setPwSubmitting(true);
    try {
      await changePassword(pwCurrent, pwNew);
      setPwInfo('Password updated. You will be signed out shortly…');
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
      window.setTimeout(() => logout(), 1200);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Could not update password.')
          : 'Could not update password.';
      setPwError(Array.isArray(message) ? message.join(', ') : message);
      setPwSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="page-card">
        <p className="body-copy">Loading settings...</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="page-card">
        <div className="status-banner status-banner--error">
          {errorMessage || 'Settings unavailable.'}
        </div>
      </section>
    );
  }

  return (
    <section className="page-card">
      <div className="section-heading">
        <p className="eyebrow">Settings</p>
        <h2>Manage your account</h2>
      </div>

      {errorMessage ? (
        <div className="status-banner status-banner--error">{errorMessage}</div>
      ) : null}
      {avatarError ? (
        <div className="status-banner status-banner--error">{avatarError}</div>
      ) : null}

      <div className="settings-grid">
        <section className="settings-panel">
          <div className="section-heading">
            <p className="eyebrow">Profile photo</p>
            <h2>Your avatar</h2>
          </div>
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
            <div className="profile-avatar-actions">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="image-input--hidden"
                onChange={(event) => void handleProfileImageChange(event.target.files?.[0])}
              />
              <button
                type="button"
                className="ghost-button profile-avatar-button"
                disabled={isAvatarUploading}
                onClick={() => avatarInputRef.current?.click()}
              >
                {isAvatarUploading ? 'Uploading...' : 'Update photo'}
              </button>
            </div>
          </div>
        </section>

        <section className="settings-panel">
          <div className="section-heading">
            <p className="eyebrow">Bio</p>
            <h2>About you</h2>
          </div>
          {isEditingBio ? (
            <form className="profile-bio-form" onSubmit={handleSaveBio} noValidate>
              <div className={`form-field${bioError ? ' form-field--error' : ''}`}>
                <label htmlFor="settings-bio">Bio</label>
                <textarea
                  id="settings-bio"
                  rows={5}
                  maxLength={280}
                  value={bioDraft}
                  onChange={(event) => setBioDraft(event.target.value)}
                  placeholder="Tell people a little about yourself"
                />
                <div className="profile-bio-form__meta">
                  <span className="profile-bio-form__count">{bioDraft.length}/280</span>
                </div>
                {bioError ? <span className="field-error">{bioError}</span> : null}
              </div>
              <div className="form-actions">
                <button className="submit-button" type="submit" disabled={isBioSaving}>
                  {isBioSaving ? 'Saving...' : 'Save bio'}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  disabled={isBioSaving}
                  onClick={() => {
                    setBioDraft(profile.bio ?? '');
                    setBioError('');
                    setIsEditingBio(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="profile-copy__bio settings-bio-copy">
                {profile.bio || 'You have not added a bio yet.'}
              </p>
              <button
                type="button"
                className="ghost-button profile-bio-edit"
                onClick={() => {
                  setBioDraft(profile.bio ?? '');
                  setBioError('');
                  setIsEditingBio(true);
                }}
              >
                {profile.bio ? 'Edit bio' : 'Add bio'}
              </button>
            </>
          )}
        </section>
      </div>

      <div className="profile-password-section">
        <div className="section-heading">
          <p className="eyebrow">Security</p>
          <h2>Change password</h2>
        </div>
        {!showChangePassword ? (
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              setShowChangePassword(true);
              setPwError('');
              setPwInfo('');
            }}
          >
            Change password
          </button>
        ) : (
          <form className="auth-form" onSubmit={handleChangePassword} noValidate>
            <div className="form-field">
              <label htmlFor="settings-pw-current">Current password</label>
              <input
                id="settings-pw-current"
                type="password"
                value={pwCurrent}
                onChange={(event) => setPwCurrent(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="form-field">
              <label htmlFor="settings-pw-new">New password</label>
              <input
                id="settings-pw-new"
                type="password"
                value={pwNew}
                onChange={(event) => setPwNew(event.target.value)}
                onFocus={() => setPwNewFocused(true)}
                onBlur={() => setPwNewFocused(false)}
                autoComplete="new-password"
              />
              {(pwNewFocused || pwNew.length > 0) && (
                <ul className="password-rules">
                  {[
                    { label: 'At least 8 characters', passed: pwNew.length >= 8 },
                    { label: 'At least 1 uppercase letter', passed: /[A-Z]/.test(pwNew) },
                    { label: 'At least 1 lowercase letter', passed: /[a-z]/.test(pwNew) },
                    { label: 'At least 1 number', passed: /\d/.test(pwNew) },
                    {
                      label: 'At least 1 special character',
                      passed: /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(pwNew),
                    },
                  ].map((rule) => (
                    <li
                      key={rule.label}
                      className={`password-rule ${rule.passed ? 'password-rule--pass' : 'password-rule--fail'}`}
                    >
                      <span className="password-rule__icon">{rule.passed ? '✓' : '✗'}</span>
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="settings-pw-confirm">Confirm new password</label>
              <input
                id="settings-pw-confirm"
                type="password"
                value={pwConfirm}
                onChange={(event) => setPwConfirm(event.target.value)}
                autoComplete="new-password"
              />
            </div>
            {pwError ? (
              <div className="status-banner status-banner--error">{pwError}</div>
            ) : null}
            {pwInfo ? (
              <div className="status-banner status-banner--success">{pwInfo}</div>
            ) : null}
            <div className="form-actions">
              <button className="submit-button" type="submit" disabled={pwSubmitting}>
                {pwSubmitting ? 'Updating...' : 'Update password'}
              </button>
              <button
                type="button"
                className="ghost-button"
                disabled={pwSubmitting}
                onClick={() => {
                  setShowChangePassword(false);
                  setPwCurrent('');
                  setPwNew('');
                  setPwConfirm('');
                  setPwError('');
                  setPwInfo('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="settings-panel settings-panel--danger">
        <div className="section-heading">
          <p className="eyebrow">Danger zone</p>
          <h2>Delete account</h2>
        </div>
        <p className="body-copy">
          Permanently remove your account, profile, posts, comments, likes, messages, and conversations.
        </p>
        <button
          className="delete-account-button"
          type="button"
          disabled={isDeleteAccountPending}
          onClick={() => void handleDeleteAccount()}
        >
          {isDeleteAccountPending ? 'Deleting...' : 'Delete account'}
        </button>
      </div>
    </section>
  );
}
