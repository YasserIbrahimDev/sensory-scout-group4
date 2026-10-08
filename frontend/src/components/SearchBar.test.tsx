import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar, { EMPTY_SEARCH_MESSAGE } from './SearchBar';

describe('SearchBar', () => {
  it('TC-HOME-08: has a labelled search field with the wireframe placeholder', () => {
    render(<SearchBar onSearch={vi.fn()} />);
    const input = screen.getByRole('searchbox', { name: 'Search places' });
    expect(input).toHaveAttribute('placeholder', 'Search by name, category, or location...');
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('TC-HOME-09: submits the trimmed query with the Enter key', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await userEvent.type(screen.getByRole('searchbox'), '  coffee {Enter}');
    expect(onSearch).toHaveBeenCalledWith('coffee');
  });

  it('TC-HOME-10: explains how to fix an empty search and keeps focus on the field', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(EMPTY_SEARCH_MESSAGE);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(EMPTY_SEARCH_MESSAGE);
    expect(input).toHaveFocus();
  });

  it('TC-HOME-11: clears the error once the user starts typing', async () => {
    render(<SearchBar onSearch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await userEvent.type(screen.getByRole('searchbox'), 'p');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
