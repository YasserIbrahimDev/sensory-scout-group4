export const MIN_PASSWORD_LENGTH = 8;

export interface SignInForm {
  email: string;
  password: string;
}

export interface SignUpForm extends SignInForm {
  name: string;
  confirmPassword: string;
}

/** One message per field that has a problem. An empty object means the form is valid. */
export type FormErrors<T> = Partial<Record<keyof T, string>>;

// Simple on purpose: something@something.something. The server does the real check.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailError(email: string): string | undefined {
  const value = email.trim();
  if (!value) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(value)) return 'Enter an email address like name@example.com.';
  return undefined;
}

export function validateSignIn(form: SignInForm): FormErrors<SignInForm> {
  const errors: FormErrors<SignInForm> = {};
  const email = emailError(form.email);
  if (email) errors.email = email;
  if (!form.password) errors.password = 'Enter your password.';
  return errors;
}

export function validateSignUp(form: SignUpForm): FormErrors<SignUpForm> {
  const errors: FormErrors<SignUpForm> = {};
  if (!form.name.trim()) errors.name = 'Enter your name.';
  const email = emailError(form.email);
  if (email) errors.email = email;
  if (!form.password) {
    errors.password = 'Create a password.';
  } else if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
  }
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Enter your password again.';
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'The passwords do not match.';
  }
  return errors;
}
