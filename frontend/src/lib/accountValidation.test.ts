import { validateSignIn, validateSignUp } from './accountValidation';

const validSignUp = { name: 'Sam', email: 'sam@example.com', password: 'long-enough-pw', confirmPassword: 'long-enough-pw' };

describe('account form validation', () => {
  it('TC-PROFILE-24: sign in needs an email that looks right and a password', () => {
    expect(validateSignIn({ email: '', password: '' })).toEqual({
      email: 'Enter your email address.',
      password: 'Enter your password.',
    });
    expect(validateSignIn({ email: 'sam@example', password: 'x' })).toEqual({
      email: 'Enter an email address like name@example.com.',
    });
    expect(validateSignIn({ email: ' sam@example.com ', password: 'x' })).toEqual({});
  });

  it('TC-PROFILE-25: sign up needs a name, a long enough password, and matching passwords', () => {
    expect(validateSignUp(validSignUp)).toEqual({});
    expect(validateSignUp({ ...validSignUp, name: '  ' }).name).toBe('Enter your name.');
    expect(validateSignUp({ ...validSignUp, password: 'short', confirmPassword: 'short' }).password)
      .toBe('Use at least 12 characters for your password.');
    expect(validateSignUp({ ...validSignUp, confirmPassword: 'different' }).confirmPassword)
      .toBe('The passwords do not match.');
    expect(validateSignUp({ ...validSignUp, confirmPassword: '' }).confirmPassword)
      .toBe('Enter your password again.');
  });

  it('TC-PROFILE-26: sign up uses the backend limits (password 12–128, name up to 160)', () => {
    const pw = (length: number) => ({ password: 'a'.repeat(length), confirmPassword: 'a'.repeat(length) });
    expect(validateSignUp({ ...validSignUp, ...pw(11) }).password).toBe('Use at least 12 characters for your password.');
    expect(validateSignUp({ ...validSignUp, ...pw(12) })).toEqual({});
    expect(validateSignUp({ ...validSignUp, ...pw(128) })).toEqual({});
    expect(validateSignUp({ ...validSignUp, ...pw(129) }).password).toBe('Use 128 characters or fewer for your password.');
    expect(validateSignUp({ ...validSignUp, name: 'n'.repeat(160) })).toEqual({});
    expect(validateSignUp({ ...validSignUp, name: 'n'.repeat(161) }).name).toBe('Use 160 characters or fewer for your name.');
  });
});
