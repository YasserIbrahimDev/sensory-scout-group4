import { render, screen } from '@testing-library/react';
import SensoryBadge from './SensoryBadge';

describe('SensoryBadge', () => {
  it('TC-HOME-01: shows a text label for each sensory type, not color alone', () => {
    render(
      <>
        <SensoryBadge type="noise" level="low" />
        <SensoryBadge type="lighting" level="dim" />
        <SensoryBadge type="crowd" level="high" />
      </>,
    );
    expect(screen.getByText('Quiet')).toBeInTheDocument();
    expect(screen.getByText('Dim light')).toBeInTheDocument();
    expect(screen.getByText('High crowds')).toBeInTheDocument();
  });

  it('TC-HOME-02: uses the shared lighting labels Dim / Normal / Bright', () => {
    render(
      <>
        <SensoryBadge type="lighting" level="normal" />
        <SensoryBadge type="lighting" level="bright" />
      </>,
    );
    expect(screen.getByText('Normal light')).toBeInTheDocument();
    expect(screen.getByText('Bright light')).toBeInTheDocument();
  });

  it('TC-HOME-03: hides the decorative icon from screen readers', () => {
    const { container } = render(<SensoryBadge type="noise" level="moderate" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
