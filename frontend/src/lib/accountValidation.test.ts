import { validateSignIn, validateSignUp } from './accountValidation';

const validSignUp = { name: 'Sam', email: 'sam@example.com', password: 'longenough', confirmPassword: 'longenough' };

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
      .toBe('Use at least 8 characters for your password.');
    expect(validateSignUp({ ...validSignUp, confirmPassword: 'different' }).confirmPassword)
      .toBe('The passwords do not match.');
    expect(validateSignUp({ ...validSignUp, confirmPassword: '' }).confirmPassword)
      .toBe('Enter your password again.');
  });
});
