import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the empty habitat shell', () => {
    render(<App />);
    expect(screen.getByText('No pets connected')).toBeInTheDocument();
  });
});
