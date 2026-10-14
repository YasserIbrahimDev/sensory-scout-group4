import type { LucideIcon } from 'lucide-react';
import type { CrowdLevel, LightingLevel, NoiseLevel } from '../types/place';
import { crowdLabels, lightingLabels, noiseLabels } from '../lib/sensoryLabels';
import { crowdIcons, lightingIcons, noiseIcons } from '../lib/sensoryIcons';

export type SensoryBadgeProps =
  | { type: 'noise'; level: NoiseLevel }
  | { type: 'lighting'; level: LightingLevel }
  | { type: 'crowd'; level: CrowdLevel };

function getBadge(props: SensoryBadgeProps): { label: string; Icon: LucideIcon } {
  switch (props.type) {
    case 'noise':
      return { label: noiseLabels[props.level], Icon: noiseIcons[props.level] };
    case 'lighting':
      return { label: lightingLabels[props.level], Icon: lightingIcons[props.level] };
    case 'crowd':
      return { label: crowdLabels[props.level], Icon: crowdIcons[props.level] };
  }
}

/**
 * Shows one sensory attribute with an icon and a text label.
 * The text always carries the meaning, so the badge never relies on color alone (NF1).
 */
export default function SensoryBadge(props: SensoryBadgeProps) {
  const { label, Icon } = getBadge(props);

  return (
    <span className={`sensory-badge sensory-badge--${props.type}`}>
      <Icon className="sensory-badge__icon" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
