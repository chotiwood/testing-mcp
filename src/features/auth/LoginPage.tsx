import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import btechAnimation from '@btech/assets/anim/load-btech-anim.json';
import { LottiePlayer } from '@/components/LottiePlayer';
import { BTForm } from '@/components/ui/form';
import { BTInput } from '@/components/ui/input';
import { BTButton } from '@/components/ui/button';
import { BTButtonLink } from '@/components/ui/button-link';
import { BTAlert } from '@/components/ui/alert';
import { BTLoading } from '@/components/ui/loading';
import { useAuth } from './AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import './LoginPage.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginValues extends Record<string, unknown> {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  return (
    <div className="login-page">
      <section className="login-page__brand" aria-hidden="true">
        <div className="login-page__brand-anim">
          <LottiePlayer animationData={btechAnimation} loop />
        </div>
        <p className="login-page__brand-wordmark">BTECH</p>
        <p className="login-page__brand-tagline">Design System Workspace</p>
      </section>

      <section className="login-page__form-panel">
        <div className="login-page__form-card">
          <header className="login-page__header">
            <p className="login-page__eyebrow">BTECH</p>
            <h1 className="login-page__title">Welcome back</h1>
            <p className="login-page__subtitle">Sign in to continue to your dashboard.</p>
          </header>

          {authError && (
            <BTAlert
              variant="error"
              label="Sign in failed"
              description={authError}
              dismissible
              onDismiss={() => setAuthError(null)}
            />
          )}

          <BTForm<LoginValues>
            initialValues={{ email: '', password: '' }}
            validation={{
              email: (value: unknown) => {
                const email = String(value ?? '').trim();
                if (!email) return 'Email is required';
                if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address';
                return null;
              },
              password: (value: unknown) => {
                const password = String(value ?? '');
                if (!password) return 'Password is required';
                if (password.length < 6) return 'Password must be at least 6 characters';
                return null;
              },
            }}
            onSubmit={async ({ email, password }) => {
              setAuthError(null);
              setIsSubmitting(true);
              try {
                await login(email, password);
                navigate('/dashboard', { replace: true });
              } catch (error) {
                setAuthError(error instanceof Error ? error.message : 'Something went wrong.');
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {(form) => (
              <div className="login-page__fields">
                <BTInput
                  name="email"
                  id="login-email"
                  label="Email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={String(form.values.email ?? '')}
                  errorText={form.errorFor('email') ?? undefined}
                  onChange={(value) => form.setField('email', value)}
                  onBlur={() => form.touch('email')}
                  disabled={isSubmitting}
                />

                <BTInput
                  name="password"
                  id="login-password"
                  label="Password"
                  type="password"
                  showPasswordToggle
                  required
                  placeholder="Enter your password"
                  value={String(form.values.password ?? '')}
                  errorText={form.errorFor('password') ?? undefined}
                  onChange={(value) => form.setField('password', value)}
                  onBlur={() => form.touch('password')}
                  disabled={isSubmitting}
                />

                <div className="login-page__forgot-row">
                  <BTButtonLink
                    type="button"
                    label="Forgot password?"
                    variant="primary"
                    onClick={() => setIsForgotPasswordOpen(true)}
                  />
                </div>

                <BTButton
                  type="submit"
                  variant="primary"
                  className="login-page__submit"
                  disabled={isSubmitting}
                  leftIcon={isSubmitting ? <BTLoading type="spinner" size={18} /> : undefined}
                  label={isSubmitting ? 'Signing in…' : 'Sign in'}
                />

                <p className="login-page__hint">
                  Demo only — any email/password (6+ characters) signs you in.
                </p>
              </div>
            )}
          </BTForm>
        </div>
      </section>

      <ForgotPasswordModal
        open={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
}
