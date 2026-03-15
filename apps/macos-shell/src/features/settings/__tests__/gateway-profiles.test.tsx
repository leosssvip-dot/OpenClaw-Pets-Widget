import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import { GatewayProfiles } from '../GatewayProfiles';

describe('GatewayProfiles', () => {
  it('prefills an existing profile for editing and forwards delete actions', async () => {
    const onSaveProfile = vi.fn();
    const onDeleteProfile = vi.fn();

    render(
      <GatewayProfiles
        profiles={[
          {
            id: 'remote-1',
            label: '10.0.0.52',
            transport: 'ssh',
            host: '10.0.0.52',
            username: 'chenyang',
            sshPort: 22,
            remoteGatewayPort: 18789,
            gatewayToken: 'secret-token'
          },
          {
            id: 'remote-2',
            label: '10.0.0.53',
            transport: 'ssh',
            host: '10.0.0.53',
            username: 'chenyang',
            sshPort: 2222,
            remoteGatewayPort: 18789,
            gatewayToken: 'secret-token'
          }
        ]}
        activeProfileId="remote-1"
        onSaveProfile={onSaveProfile}
        onDeleteProfile={onDeleteProfile}
      />
    );

    const profiles = screen.getAllByRole('listitem');

    fireEvent.click(within(profiles[0]).getByRole('button', { name: 'Edit' }));

    expect(screen.getByLabelText('Remote Host')).toHaveValue('10.0.0.52');
    expect(screen.getByLabelText('SSH User')).toHaveValue('chenyang');
    expect(screen.getByLabelText('SSH Port')).toHaveValue(22);
    expect(screen.getByLabelText('Gateway Port')).toHaveValue(18789);
    expect(screen.getByLabelText('Gateway Token')).toHaveValue('secret-token');

    fireEvent.change(screen.getByLabelText('SSH Port'), {
      target: { value: '2200' }
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });

    expect(onSaveProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        transport: 'ssh',
        host: '10.0.0.52',
        username: 'chenyang',
        sshPort: 2200,
        remoteGatewayPort: 18789,
        gatewayToken: 'secret-token',
        password: undefined
      }),
      'remote-1'
    );

    fireEvent.click(within(profiles[1]).getByRole('button', { name: 'Delete' }));
    expect(onDeleteProfile).not.toHaveBeenCalled();

    fireEvent.click(within(profiles[1]).getByRole('button', { name: 'Confirm' }));
    expect(onDeleteProfile).toHaveBeenCalledWith('remote-2');
  });
});
