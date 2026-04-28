import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '@/features/auth/api/signup';
import { useAuth } from '@/features/auth/context/auth-context';

type SignupFormState = {
  username: string;
  email: string;
  password: string;
};

type SignupErrors = Partial<Record<keyof SignupFormState, string>>;

const initialState: SignupFormState = {
  username: '',
  email: '',
  password: '',
};

type PasswordRule = { label: string; test: (pw: string) => boolean };

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'At least 1 uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'At least 1 lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'At least 1 number', test: (pw) => /\d/.test(pw) },
  { label: 'At least 1 special character', test: (pw) => /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(pw) },
];

export function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<SignupFormState>(initialState);

  useEffect(() => {
    if (user) navigate('/feed', { replace: true });
  }, [navigate, user]);

  const [errors, setErrors] = useState<SignupErrors>({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordRuleResults = PASSWORD_RULES.map((rule) => ({
    label: rule.label,
    passed: rule.test(form.password),
  }));

  const allRulesPassed = passwordRuleResults.every((r) => r.passed);

  function validate(values: SignupFormState) {
    const nextErrors: SignupErrors = {};

    if (!values.username.trim()) {
      nextErrors.username = 'Username is required.';
    } else if (values.username.trim().length < 3) {
      nextErrors.username = 'Username must be at least 3 characters.';
    }

    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!values.password) {
      nextErrors.password = 'Password is required.';
    } else if (!allRulesPassed) {
      nextErrors.password = 'Password does not meet the requirements below.';
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setServerError('');
    setSuccessMessage('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await signup({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      setSuccessMessage(response.message);
      navigate(`/verify-email?email=${encodeURIComponent(response.email)}`);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Signup failed. Please try again.')
          : 'Signup failed. Please try again.';

      const normalizedMessage = Array.isArray(message) ? message.join(', ') : message;

      if (normalizedMessage.toLowerCase().includes('username is already in use')) {
        setErrors((current) => ({
          ...current,
          username: 'That username is already taken.',
        }));
        setServerError('');
      } else {
        setServerError(normalizedMessage);
      }

      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-card">
      <div className="section-heading">
        <p className="eyebrow">Authentication</p>
        <h2>Create your account</h2>
      </div>

      <div className="auth-grid auth-grid--cinematic">
        <div>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className={`form-field${errors.username ? ' form-field--error' : ''}`}>
              <label htmlFor="signup-username">Username</label>
              <input
                id="signup-username"
                type="text"
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({ ...current, username: event.target.value }))
                }
                placeholder="name"
                autoComplete="username"
              />
              {errors.username ? (
                <span className="field-error">{errors.username}</span>
              ) : null}
            </div>

            <div className={`form-field${errors.email ? ' form-field--error' : ''}`}>
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="email@example.com"
                autoComplete="email"
              />
              {errors.email ? <span className="field-error">{errors.email}</span> : null}
            </div>

            <div className={`form-field${errors.password ? ' form-field--error' : ''}`}>
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Choose a strong password"
                autoComplete="new-password"
              />
              {errors.password ? (
                <span className="field-error">{errors.password}</span>
              ) : null}

              {(passwordFocused || form.password.length > 0) && (
                <ul className="password-rules">
                  {passwordRuleResults.map((rule) => (
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

            {serverError ? (
              <div className="status-banner status-banner--error">{serverError}</div>
            ) : null}
            {successMessage ? (
              <div className="status-banner status-banner--success">{successMessage}</div>
            ) : null}

            <div className="form-actions">
              <button className="submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Sign up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
