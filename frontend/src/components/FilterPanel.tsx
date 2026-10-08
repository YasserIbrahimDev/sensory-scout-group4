import { useId } from 'react';
import type { FormEvent } from 'react';
import { Accessibility } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PlaceCategory } from '../types/place';
import type { SearchFilters } from '../lib/searchFilters';
import { CATEGORIES, CROWD_LEVELS, LIGHTING_LEVELS, NOISE_LEVELS, clearFilters, toggleLevel } from '../lib/searchFilters';
import { categoryLabels, crowdLevelLabels, lightingLevelLabels, noiseLevelLabels } from '../lib/sensoryLabels';
import { crowdIcons, lightingIcons, noiseIcons } from '../lib/sensoryIcons';

interface FilterPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  /** Number of places matching the current filters, or null while loading. */
  resultCount: number | null;
  onShowResults: () => void;
}

interface LevelGroupProps<T extends string> {
  legend: string;
  levels: T[];
  selected: T[];
  labels: Record<T, string>;
  icons: Record<T, LucideIcon>;
  onToggle: (level: T) => void;
}

function LevelGroup<T extends string>({ legend, levels, selected, labels, icons, onToggle }: LevelGroupProps<T>) {
  return (
    <fieldset className="filter-group">
      <legend className="filter-group__legend">{legend}</legend>
      <div className="level-buttons">
        {levels.map((level) => {
          const Icon: LucideIcon = icons[level];
          const isSelected = selected.includes(level);
          return (
            <button
              key={level}
              type="button"
              className="level-button"
              aria-pressed={isSelected}
              onClick={() => onToggle(level)}
            >
              <Icon className="level-button__icon" aria-hidden="true" />
              {labels[level]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function FilterPanel({ filters, onChange, resultCount, onShowResults }: FilterPanelProps) {
  const headingId = useId();
  const typeId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onShowResults();
  }

  const countText = resultCount === null ? '' : ` (${resultCount})`;

  return (
    <form className="filter-panel" aria-labelledby={headingId} onSubmit={handleSubmit}>
      <div className="filter-panel__header">
        <h2 id={headingId} className="filter-panel__title">Filters</h2>
        <button type="button" className="link-button" onClick={() => onChange(clearFilters(filters))}>
          Clear all
        </button>
      </div>

      <LevelGroup
        legend="Noise Level"
        levels={NOISE_LEVELS}
        selected={filters.noise}
        labels={noiseLevelLabels}
        icons={noiseIcons}
        onToggle={(level) => onChange({ ...filters, noise: toggleLevel(filters.noise, level, NOISE_LEVELS) })}
      />
      <LevelGroup
        legend="Lighting"
        levels={LIGHTING_LEVELS}
        selected={filters.lighting}
        labels={lightingLevelLabels}
        icons={lightingIcons}
        onToggle={(level) => onChange({ ...filters, lighting: toggleLevel(filters.lighting, level, LIGHTING_LEVELS) })}
      />
      <LevelGroup
        legend="Crowd Level"
        levels={CROWD_LEVELS}
        selected={filters.crowd}
        labels={crowdLevelLabels}
        icons={crowdIcons}
        onToggle={(level) => onChange({ ...filters, crowd: toggleLevel(filters.crowd, level, CROWD_LEVELS) })}
      />

      <div className="filter-group">
        <label htmlFor={typeId} className="filter-group__legend">Place Type</label>
        <select
          id={typeId}
          className="select"
          value={filters.category}
          onChange={(event) => onChange({ ...filters, category: event.target.value as PlaceCategory | '' })}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>{categoryLabels[category]}</option>
          ))}
        </select>
      </div>

      <fieldset className="filter-group">
        <legend className="filter-group__legend filter-group__legend--icon">
          <Accessibility className="filter-group__icon" aria-hidden="true" />
          Accessibility
        </legend>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={filters.wheelchair}
            onChange={(event) => onChange({ ...filters, wheelchair: event.target.checked })}
          />
          Wheelchair accessible
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={filters.sensoryRoom}
            onChange={(event) => onChange({ ...filters, sensoryRoom: event.target.checked })}
          />
          Sensory room available
        </label>
      </fieldset>

      <button type="submit" className="button button--primary filter-panel__submit">
        Show Results{countText}
      </button>
    </form>
  );
}
