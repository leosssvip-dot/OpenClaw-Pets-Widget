import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { AgentBindings } from '../AgentBindings';

describe('AgentBindings', () => {
  it('renders live agent rows and forwards avatar updates', () => {
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
              avatar: 'https://cdn.example.com/ruby.png'
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
        onUpdateAppearance={onUpdateAppearance}
      />
    );

    expect(screen.getByText('Ruby')).toBeInTheDocument();
    expect(screen.getByText('Agent: researcher')).toBeInTheDocument();
    expect(screen.getByText('Status: thinking')).toBeInTheDocument();
    expect(screen.getByText('Clawdia')).toBeInTheDocument();
    expect(screen.getByText('Status: waiting')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Avatar URL/i)).toHaveLength(2);
    expect(
      screen.getByText(/https:\/\/.*file:\/\/\/.*data:image\//i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Avatar URL for Clawdia'), {
      target: {
        value: 'file:///Users/chenyang/Pictures/clawdia.svg'
      }
    });

    expect(onUpdateAppearance).toHaveBeenCalledWith('pet-reviewer', {
      avatar: 'file:///Users/chenyang/Pictures/clawdia.svg'
    });
  });
});
