import type { LucideIcon } from 'lucide-react';
import type { CrowdLevel, LightingLevel, NoiseLevel } from '../types/place';
import { crowdLabels, lightingLabels, noiseLabels, notReportedBadgeLabels } from '../lib/sensoryLabels';
import { crowdIcons, lightingIcons, noiseIcons, notReportedIcons } from '../lib/sensoryIcons';

export type SensoryBadgeProps =
  | { type: 'noise'; level: NoiseLevel | null }
  | { type: 'lighting'; level: LightingLevel | null }
  | { type: 'crowd'; level: CrowdLevel | null };

function getBadge(props: SensoryBadgeProps): { label: string; Icon: LucideIcon } {
  if (props.level === null) {
    return { label: notReportedBadgeLabels[props.type], Icon: notReportedIcons[props.type] };
  }
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
    <span className={`sensory-badge sensory-badge--${props.type}${props.level === null ? ' sensory-badge--unknown' : ''}`}>
      <Icon className="sensory-badge__icon" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
