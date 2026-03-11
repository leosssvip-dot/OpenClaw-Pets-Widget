import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { SshConnectionForm } from '../SshConnectionForm';

describe('SshConnectionForm', () => {
  it('submits remote ssh settings', () => {
    const onSubmit = vi.fn();

    render(<SshConnectionForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Remote Host'), {
      target: { value: 'studio.internal' }
    });
    fireEvent.change(screen.getByLabelText('SSH User'), {
      target: { value: 'chenyang' }
    });
    fireEvent.change(screen.getByLabelText('SSH Password'), {
      target: { value: 'hunter2' }
    });
    fireEvent.change(screen.getByLabelText('Gateway Token'), {
      target: { value: 'secret-token' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'studio.internal',
        username: 'chenyang',
        sshPort: 22,
        remoteGatewayPort: 18789,
        gatewayToken: 'secret-token',
        identityFile: undefined,
        password: 'hunter2'
      })
    );
    expect(
      screen.getByText(/SSH Password is securely cached for reconnects/i)
    ).toBeInTheDocument();
  });
});
