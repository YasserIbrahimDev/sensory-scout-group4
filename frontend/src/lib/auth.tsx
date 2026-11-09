import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { SignInDetails, SignUpDetails, User } from '../types/user';
import * as client from '../api/client';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: User };

interface AuthContextValue {
  auth: AuthState;
  signIn: (details: SignInDetails) => Promise<User>;
  signUp: (details: SignUpDetails) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Keeps track of who is signed in so every page agrees. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    client
      .getCurrentUser()
      .then((user) => {
        if (!cancelled) setAuth(user ? { status: 'signedIn', user } : { status: 'signedOut' });
      })
      .catch(() => {
        // If we can't tell, treat the user as signed out; they can sign in again.
        if (!cancelled) setAuth({ status: 'signedOut' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (details: SignInDetails) => {
    const user = await client.signIn(details);
    setAuth({ status: 'signedIn', user });
    return user;
  }, []);

  const signUp = useCallback(async (details: SignUpDetails) => {
    const user = await client.signUp(details);
    setAuth({ status: 'signedIn', user });
    return user;
  }, []);

  const signOut = useCallback(async () => {
    await client.signOut();
    setAuth({ status: 'signedOut' });
  }, []);

  const value = useMemo(() => ({ auth, signIn, signUp, signOut }), [auth, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>.');
  return value;
}
