import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

describe('App smoke test', () => {
  it('renders the login page without throwing', () => {
    const { container } = render(<App />);
    expect(screen.getByText('Welcome back')).toBeTruthy();
    expect(container.querySelectorAll('.login-page').length).toBe(1);
  });

  it('shows a validation error for an invalid email', async () => {
    const { container } = render(<App />);
    const emailInput = container.querySelector('#login-email') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getByText('Enter a valid email address')).toBeTruthy();
    });
  });

  it('logs in and navigates to the dashboard', async () => {
    const { container } = render(<App />);
    const emailInput = container.querySelector('#login-email') as HTMLInputElement;
    const passwordInput = container.querySelector('#login-password') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'demo@btech.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign in'));

    await waitFor(
      () => {
        expect(screen.getByText(/Welcome back, Demo/)).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });
});
