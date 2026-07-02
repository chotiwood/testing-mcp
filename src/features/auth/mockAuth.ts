/**
 * Mock/dummy authentication layer — no backend integration.
 *
 * Simulates realistic network latency and a single deterministic failure
 * case so the error-handling UI (BTAlert) has something to demonstrate.
 * Any other syntactically valid email/password combination succeeds.
 */

export interface MockUser {
  name: string;
  email: string;
}

const NETWORK_DELAY_MS = 1100;
const RESET_DELAY_MS = 1000;

/** Credentials reserved to demo the failed-login path. */
const DEMO_FAILURE_EMAIL = 'fail@btech.com';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deriveNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'User';
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function mockLogin(email: string, password: string): Promise<MockUser> {
  await delay(NETWORK_DELAY_MS);

  if (email.toLowerCase() === DEMO_FAILURE_EMAIL || password.length < 6) {
    throw new Error('Invalid email or password. Please try again.');
  }

  return { name: deriveNameFromEmail(email), email };
}

export async function mockRequestPasswordReset(email: string): Promise<void> {
  await delay(RESET_DELAY_MS);
  void email;
  // Always succeeds — dummy behavior only, no backend involved.
}
