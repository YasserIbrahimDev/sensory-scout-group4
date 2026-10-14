import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterPanel from './FilterPanel';
import { emptyFilters } from '../lib/searchFilters';

function setup(overrides = {}, resultCount: number | null = 6) {
  const onChange = vi.fn();
  const onShowResults = vi.fn();
  render(
    <FilterPanel
      filters={{ ...emptyFilters, ...overrides }}
      onChange={onChange}
      resultCount={resultCount}
      onShowResults={onShowResults}
    />,
  );
  return { onChange, onShowResults };
}

describe('FilterPanel', () => {
  it('TC-SEARCH-08: shows the noise, lighting, and crowd groups with plain-language buttons', () => {
    setup();
    const noise = screen.getByRole('group', { name: 'Noise Level' });
    const lighting = screen.getByRole('group', { name: 'Lighting' });
    const crowd = screen.getByRole('group', { name: 'Crowd Level' });
    const labels = (group: HTMLElement) => within(group).getAllByRole('button').map((b) => b.textContent);
    expect(labels(noise)).toEqual(['Low', 'Moderate', 'High']);
    expect(labels(lighting)).toEqual(['Dim', 'Normal', 'Bright']);
    expect(labels(crowd)).toEqual(['Low', 'Moderate', 'High']);
  });

  it('TC-SEARCH-09: tells screen readers which buttons are selected', () => {
    setup({ noise: ['low'] });
    const noise = screen.getByRole('group', { name: 'Noise Level' });
    expect(within(noise).getByRole('button', { name: 'Low' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(noise).getByRole('button', { name: 'High' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('TC-SEARCH-10: selecting a level with the keyboard updates the filters', async () => {
    const { onChange } = setup();
    const lighting = screen.getByRole('group', { name: 'Lighting' });
    within(lighting).getByRole('button', { name: 'Dim' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith({ ...emptyFilters, lighting: ['dim'] });
  });

  it('TC-SEARCH-11: Place Type defaults to "All categories" and can be changed', async () => {
    const { onChange } = setup();
    const select = screen.getByRole('combobox', { name: 'Place Type' });
    expect(select).toHaveDisplayValue('All categories');
    await userEvent.selectOptions(select, 'Cafe');
    expect(onChange).toHaveBeenCalledWith({ ...emptyFilters, category: 'cafe' });
  });

  it('TC-SEARCH-12: accessibility checkboxes update the filters', async () => {
    const { onChange } = setup();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Wheelchair accessible' }));
    expect(onChange).toHaveBeenCalledWith({ ...emptyFilters, wheelchair: true });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sensory room available' }));
    expect(onChange).toHaveBeenCalledWith({ ...emptyFilters, sensoryRoom: true });
  });

  it('TC-SEARCH-13: Clear all removes every filter but keeps the search text', async () => {
    const { onChange } = setup({ q: 'cafe', noise: ['low'], crowd: ['high'], wheelchair: true });
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onChange).toHaveBeenCalledWith({ ...emptyFilters, q: 'cafe' });
  });

  it('TC-SEARCH-14: Show Results shows the count and moves to the results', async () => {
    const { onShowResults } = setup({}, 4);
    await userEvent.click(screen.getByRole('button', { name: 'Show Results (4)' }));
    expect(onShowResults).toHaveBeenCalled();
  });

  it('TC-SEARCH-15: Show Results hides the count while loading', () => {
    setup({}, null);
    expect(screen.getByRole('button', { name: 'Show Results' })).toBeInTheDocument();
  });
});
