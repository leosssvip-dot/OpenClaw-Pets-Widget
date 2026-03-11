import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { AgentBindings } from '../AgentBindings';

describe('AgentBindings', () => {
  it('renders display and character controls and forwards role-pack updates', () => {
    const onUpdateAppearance = vi.fn();

    render(
      <AgentBindings
        rows={[
          {
            petId: 'pet-researcher',
            petName: 'Ruby',
            agentId: 'researcher',
            gatewayId: 'remote-1',
            status: 'thinking',
            isSelected: true,
            appearance: {
              rolePack: 'robot'
            }
          },
          {
            petId: 'pet-reviewer',
            petName: 'Clawdia',
            agentId: 'reviewer',
            gatewayId: 'remote-1',
            status: 'waiting',
            isSelected: false
          }
        ]}
        displayMode="pinned"
        pinnedAgentId="researcher"
        onDisplayModeChange={vi.fn()}
        onPinnedAgentChange={vi.fn()}
        onUpdateAppearance={onUpdateAppearance}
      />
    );

    expect(screen.getByRole('heading', { name: 'Display' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Characters' })).toBeInTheDocument();
    expect(screen.getByText('Agent: researcher')).toBeInTheDocument();
    expect(screen.getByText('Status: thinking')).toBeInTheDocument();
    expect(screen.getByText('Status: waiting')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Character for/i)).toHaveLength(2);
    expect(screen.queryByLabelText(/Avatar URL/i)).toBeNull();

    fireEvent.change(screen.getByLabelText('Character for Clawdia'), {
      target: {
        value: 'monk'
      }
    });

    expect(onUpdateAppearance).toHaveBeenCalledWith('pet-reviewer', {
      rolePack: 'monk'
    });
  });
});
