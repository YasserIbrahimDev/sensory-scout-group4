import { Link, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';

/** Router state passed to the Profile page so signing in returns the user to where they were. */
export interface SignInLinkState {
  from: string;
}

interface SignInPromptProps {
  message: string;
}

/** Shown when a signed-out user tries something that needs an account. */
export default function SignInPrompt({ message }: SignInPromptProps) {
  const location = useLocation();
  const linkState: SignInLinkState = { from: location.pathname + location.search };

  return (
    <div className="sign-in-prompt">
      <p>{message}</p>
      <Link to="/profile" state={linkState} className="button button--primary">
        <LogIn className="button__icon" aria-hidden="true" />
        Sign in or create an account
      </Link>
    </div>
  );
}
