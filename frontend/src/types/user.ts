import type { CrowdLevel, LightingLevel, NoiseLevel } from './place';

export interface User {
  id: string;
  name: string;
  email: string;
}

/** The levels a user is most comfortable with. Null means "No preference". */
export interface SensoryPreferences {
  noise: NoiseLevel | null;
  lighting: LightingLevel | null;
  crowd: CrowdLevel | null;
}

export interface AppSettings {
  /** When false, the app never asks for location; search by name or address still works. */
  locationAccess: boolean;
}

export interface SignInDetails {
  email: string;
  password: string;
}

export interface SignUpDetails extends SignInDetails {
  name: string;
}
