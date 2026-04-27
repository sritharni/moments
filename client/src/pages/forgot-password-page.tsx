import { AxiosError } from 'axios';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '@/features/auth/api/forgot-password';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [serverError, setServerError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError('');
    setInfo('');

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setServerError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setInfo(
        "If an account exists for that email, we've sent a reset link. Check your inbox (and spam folder).",
      );
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Could not send reset link.')
          : 'Could not send reset link.';
      setServerError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-card">
      <div className="section-heading">
        <p className="eyebrow">Authentication</p>
        <h2>Forgot your password?</h2>
      </div>

      <div className="auth-grid">
        <div>
          <p className="body-copy">
            Enter the email associated with your account and we'll send you a
            link to reset your password.
          </p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@example.com"
                autoComplete="email"
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
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </button>
              <Link to="/login">Back to login</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
