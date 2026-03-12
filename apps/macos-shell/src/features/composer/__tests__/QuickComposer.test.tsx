import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { QuickComposer } from '../QuickComposer';

describe('QuickComposer', () => {
  it('submits a quick task to the selected pet', async () => {
    const onSubmit = vi.fn();

    render(<QuickComposer petName="Scout" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: "Summarize today's unread Feishu threads" }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Task' }));

    expect(onSubmit).toHaveBeenCalledWith("Summarize today's unread Feishu threads");
  });
});
