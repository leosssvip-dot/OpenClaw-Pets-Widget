import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PetBubble } from '../PetBubble';

describe('PetBubble', () => {
  it('renders nothing when mode is null', () => {
    const { container } = render(<PetBubble mode={null} />);
    expect(container.querySelector('.pet-bubble')).toBeNull();
  });

  it('renders status text in status mode', () => {
    render(<PetBubble mode="status" statusText="Working on it..." />);
    expect(screen.getByText('Working on it...')).toBeInTheDocument();
  });

  it('renders an input form in input mode', () => {
    render(<PetBubble mode="input" />);
    expect(screen.getByPlaceholderText(/say something/i)).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('calls onSend when form is submitted with text', () => {
    const onSend = vi.fn();
    const onClose = vi.fn();
    render(<PetBubble mode="input" onSend={onSend} onClose={onClose} />);

    const input = screen.getByPlaceholderText(/say something/i);
    fireEvent.change(input, { target: { value: 'Hello monk!' } });
    fireEvent.submit(input.closest('form')!);

    expect(onSend).toHaveBeenCalledWith('Hello monk!');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onSend with empty input', () => {
    const onSend = vi.fn();
    render(<PetBubble mode="input" onSend={onSend} />);

    fireEvent.submit(screen.getByPlaceholderText(/say something/i).closest('form')!);
    expect(onSend).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<PetBubble mode="input" onClose={onClose} />);

    fireEvent.keyDown(screen.getByPlaceholderText(/say something/i), {
      key: 'Escape',
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('disables send button when input is empty', () => {
    render(<PetBubble mode="input" />);
    expect(screen.getByText('Send')).toBeDisabled();
  });
});
