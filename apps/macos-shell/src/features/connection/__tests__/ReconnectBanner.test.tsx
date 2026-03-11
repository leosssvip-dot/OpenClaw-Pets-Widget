import { render, screen } from '@testing-library/react';
import { ReconnectBanner } from '../ReconnectBanner';

describe('ReconnectBanner', () => {
  it('renders a specific connection error when one is available', () => {
    render(
      <ReconnectBanner
        status="offline"
        errorMessage="Gateway protocol mismatch: server requires connect.challenge."
        hasActiveProfile={true}
        onReconnect={() => undefined}
      />
    );

    expect(
      screen.getByText('Gateway protocol mismatch: server requires connect.challenge.')
    ).toBeInTheDocument();
  });
});
