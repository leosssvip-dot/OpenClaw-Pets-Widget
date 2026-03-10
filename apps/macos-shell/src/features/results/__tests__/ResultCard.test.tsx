import { render, screen } from '@testing-library/react';
import { ResultCard } from '../ResultCard';

describe('ResultCard', () => {
  it('renders the latest task result summary', () => {
    render(<ResultCard title="Scout" body="Prepare a handoff note" status="Done" />);

    expect(screen.getByText('Scout')).toBeInTheDocument();
    expect(screen.getByText('Prepare a handoff note')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });
});
