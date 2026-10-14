import { Flower2, Thermometer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SensoryInfo as SensoryInfoData } from '../types/place';
import { crowdLabels, lightingLabels, noiseLabels, notReportedLabel, sensoryTypeLabels } from '../lib/sensoryLabels';
import { crowdIcons, lightingIcons, noiseIcons } from '../lib/sensoryIcons';

interface Tile {
  key: keyof typeof sensoryTypeLabels;
  value: string;
  Icon: LucideIcon;
}

interface SensoryInfoProps {
  sensory: SensoryInfoData;
  headingId: string;
}

/** The "Sensory Information" row on Place Details: five tiles with an icon, caption, and text value. */
export default function SensoryInfo({ sensory, headingId }: SensoryInfoProps) {
  const tiles: Tile[] = [
    { key: 'noise', value: noiseLabels[sensory.noise], Icon: noiseIcons[sensory.noise] },
    { key: 'lighting', value: lightingLabels[sensory.lighting], Icon: lightingIcons[sensory.lighting] },
    { key: 'crowd', value: crowdLabels[sensory.crowd], Icon: crowdIcons[sensory.crowd] },
    { key: 'temperature', value: sensory.temperature ?? notReportedLabel, Icon: Thermometer },
    { key: 'scents', value: sensory.scents ?? notReportedLabel, Icon: Flower2 },
  ];

  return (
    <section className="sensory-info" aria-labelledby={headingId}>
      <h2 id={headingId} className="sensory-info__title">Sensory Information</h2>
      <dl className="sensory-tiles">
        {tiles.map(({ key, value, Icon }) => (
          <div key={key} className={`sensory-tile sensory-tile--${key}`}>
            <Icon className="sensory-tile__icon" aria-hidden="true" />
            <dt className="sensory-tile__caption">{sensoryTypeLabels[key]}</dt>
            <dd className="sensory-tile__value">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
