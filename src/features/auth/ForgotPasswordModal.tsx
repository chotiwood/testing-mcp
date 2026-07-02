import { useEffect, useState } from 'react';
import { BTModal } from '@/components/ui/modal';
import { BTForm } from '@/components/ui/form';
import { BTInput } from '@/components/ui/input';
import { BTAlert } from '@/components/ui/alert';
import { BTLoading } from '@/components/ui/loading';
import { BTButton } from '@/components/ui/button';
import { mockRequestPasswordReset } from './mockAuth';
import './ForgotPasswordModal.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTO_CLOSE_DELAY_MS = 1800;

interface ForgotPasswordValues extends Record<string, unknown> {
  email: string;
}

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset local state whenever the modal is re-opened.
  useEffect(() => {
    if (open) {
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [open]);

  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(onClose, AUTO_CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isSuccess, onClose]);

  return (
    <BTModal
      open={open}
      title="Forgot password"
      subtext="Enter the email linked to your account and we'll send you a reset link."
      hasFooter={false}
      onClose={onClose}
      dismissable={!isSubmitting}
    >
      {isSuccess ? (
        <BTAlert
          variant="success"
          label="Reset link sent"
          description="Check your inbox for instructions to reset your password."
        />
      ) : (
        <BTForm<ForgotPasswordValues>
          initialValues={{ email: '' }}
          validation={{
            email: (value: unknown) => {
              const email = String(value ?? '').trim();
              if (!email) return 'Email is required';
              if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address';
              return null;
            },
          }}
          onSubmit={async ({ email }) => {
            setIsSubmitting(true);
            await mockRequestPasswordReset(email);
            setIsSubmitting(false);
            setIsSuccess(true);
          }}
        >
          {(form) => (
            <div className="forgot-password-form">
              <BTInput
                name="email"
                id="forgot-password-email"
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

              <div className="forgot-password-form__actions">
                <BTButton
                  type="button"
                  variant="secondary-light"
                  label="Cancel"
                  onClick={onClose}
                  disabled={isSubmitting}
                />
                <BTButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  leftIcon={isSubmitting ? <BTLoading type="spinner" size={16} /> : undefined}
                  label={isSubmitting ? 'Sending…' : 'Send reset link'}
                />
              </div>
            </div>
          )}
        </BTForm>
      )}
    </BTModal>
  );
}
