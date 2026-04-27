import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '@/features/auth/api/forgot-password';

type PasswordRule = { label: string; test: (pw: string) => boolean };

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'At least 1 uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'At least 1 lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'At least 1 number', test: (pw) => /\d/.test(pw) },
  {
    label: 'At least 1 special character',
    test: (pw) => /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(pw),
  },
];

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serverError, setServerError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    if (!token) navigate('/forgot-password', { replace: true });
  }, [navigate, token]);

  const ruleResults = PASSWORD_RULES.map((rule) => ({
    label: rule.label,
    passed: rule.test(password),
  }));
  const allRulesPassed = ruleResults.every((r) => r.passed);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError('');
    setInfo('');

    if (!allRulesPassed) {
      setServerError('Password does not meet the requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setServerError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setInfo('Password updated. Redirecting to login…');
      window.setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Could not reset password.')
          : 'Could not reset password.';
      setServerError(Array.isArray(message) ? message.join(', ') : message);
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-card">
      <div className="section-heading">
        <p className="eyebrow">Authentication</p>
        <h2>Choose a new password</h2>
      </div>

      <div className="auth-grid">
        <div>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="reset-password">New password</label>
              <input
                id="reset-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Choose a strong password"
                autoComplete="new-password"
              />

              {(passwordFocused || password.length > 0) && (
                <ul className="password-rules">
                  {ruleResults.map((rule) => (
                    <li
                      key={rule.label}
                      className={`password-rule ${rule.passed ? 'password-rule--pass' : 'password-rule--fail'}`}
                    >
                      <span className="password-rule__icon">
                        {rule.passed ? '✓' : '✗'}
                      </span>
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="reset-confirm">Confirm new password</label>
              <input
                id="reset-confirm"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
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
                {isSubmitting ? 'Updating...' : 'Update password'}
              </button>
              <Link to="/login">Back to login</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
