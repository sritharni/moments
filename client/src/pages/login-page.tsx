import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '@/features/auth/api/login';
import { useAuth } from '@/features/auth/context/auth-context';

type LoginFormState = {
  email: string;
  password: string;
};

type LoginErrors = Partial<Record<keyof LoginFormState, string>>;

const initialState: LoginFormState = {
  email: '',
  password: '',
};

export function LoginPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [form, setForm] = useState<LoginFormState>(initialState);

  useEffect(() => {
    if (user) navigate('/feed', { replace: true });
  }, [navigate, user]);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(values: LoginFormState) {
    const nextErrors: LoginErrors = {};

    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!values.password) {
      nextErrors.password = 'Password is required.';
    } else if (values.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setServerError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await login(form);
      setUser(response.user, response.accessToken, response.refreshToken);
      navigate('/feed');
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Login failed. Please try again.')
          : 'Login failed. Please try again.';

      setServerError(Array.isArray(message) ? message.join(', ') : message);
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-card">
      <div className="section-heading">
        <p className="eyebrow">Authentication</p>
        <h2>Log in to your account</h2>
      </div>

      <div className="auth-grid auth-grid--cinematic">
        <div>
          {/* <p className="body-copy">
            Sign in with your email and password. On success, the JWT is saved
            to <code>localStorage</code> and reused for future API requests.
          </p> */}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className={`form-field${errors.email ? ' form-field--error' : ''}`}>
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
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
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              {errors.password ? (
                <span className="field-error">{errors.password}</span>
              ) : null}
            </div>

            {serverError ? (
              <div className="status-banner status-banner--error">{serverError}</div>
            ) : null}

            <div className="form-actions">
              <button className="submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Log in'}
              </button>
              <Link to="/forgot-password">Forgot password?</Link>
              {/* <Link to="/signup">Need an account? Create one</Link> */}
              {/* <span>
                Need an account?{" "}
                <Link to="/signup" style={{ color: "blue", textDecoration: "underline" }}>
                  Create one
                </Link>
              </span> */}
            </div>
          </form>
        </div>

        {/* <aside className="helper-card">
          <h3>Validation rules</h3>
          <ul className="plain-list">
            <li>Email must be in a valid format.</li>
            <li>Password must be at least 6 characters.</li>
            <li>API errors are shown inline for quick debugging.</li>
          </ul>
        </aside> */}
      </div>
    </section>
  );
}
