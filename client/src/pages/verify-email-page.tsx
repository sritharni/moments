import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resendVerification, verifyEmail } from '@/features/auth/api/verify-email';
import { useAuth } from '@/features/auth/context/auth-context';

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuth();

  const email = searchParams.get('email') ?? '';

  const [code, setCode] = useState('');
  const [serverError, setServerError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (user) navigate('/feed', { replace: true });
  }, [navigate, user]);

  useEffect(() => {
    if (!email) navigate('/signup', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(
      () => setResendCooldown((s) => s - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError('');
    setInfo('');

    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setServerError('Enter the 6-digit code from your email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await verifyEmail({ email, code: trimmed });
      setUser(response.user, response.accessToken, response.refreshToken);
      navigate('/feed');
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Verification failed.')
          : 'Verification failed.';
      setServerError(Array.isArray(message) ? message.join(', ') : message);
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || isResending) return;
    setServerError('');
    setInfo('');
    setIsResending(true);
    try {
      await resendVerification(email);
      setInfo('A new code has been sent.');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Could not resend code.')
          : 'Could not resend code.';
      setServerError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <section className="page-card">
      <div className="section-heading">
        <p className="eyebrow">Authentication</p>
        <h2>Verify your email</h2>
      </div>

      <div className="auth-grid">
        <div>
          <p className="body-copy">
            We sent a 6-digit code to <strong>{email}</strong>. Enter it below to
            activate your account.
          </p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="verify-code">Verification code</label>
              <input
                id="verify-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="123456"
              />
            </div>

            {serverError ? (
              <div className="status-banner status-banner--error">{serverError}</div>
            ) : null}
            {info ? (
              <div className="status-banner status-banner--success">{info}</div>
            ) : null}

            <div className="form-actions">
              <button className="submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : isResending
                    ? 'Sending...'
                    : 'Resend code'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
