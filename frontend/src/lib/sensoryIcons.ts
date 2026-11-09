import { BookOpen, Coffee, Landmark, Lightbulb, MapPin, Moon, ShoppingBag, Store, Sun, Trees, Users, Utensils, Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CrowdLevel, LightingLevel, NoiseLevel, PlaceCategory } from '../types/place';

// Shared icons so badges, filter buttons, and detail tiles look the same.
// Icons are always decorative: the text label next to them carries the meaning.
export const noiseIcons: Record<NoiseLevel, LucideIcon> = {
  low: VolumeX,
  moderate: Volume1,
  high: Volume2,
};

export const lightingIcons: Record<LightingLevel, LucideIcon> = {
  dim: Moon,
  normal: Lightbulb,
  bright: Sun,
};

export const crowdIcons: Record<CrowdLevel, LucideIcon> = {
  low: Users,
  moderate: Users,
  high: Users,
};

export const categoryIcons: Record<PlaceCategory, LucideIcon> = {
  library: BookOpen,
  park: Trees,
  cafe: Coffee,
  museum: Landmark,
  restaurant: Utensils,
  store: ShoppingBag,
  community: Users,
  market: Store,
  other: MapPin,
};

// Neutral icons for levels nobody has reported yet.
export const notReportedIcons = {
  noise: Volume,
  lighting: Lightbulb,
  crowd: Users,
} as const;
