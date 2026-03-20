import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PetRenderer } from '../PetRenderer';

const riveRendererMocks = vi.hoisted(() => ({
  mountSpy: vi.fn(),
}));

vi.mock('../RivePetRenderer', async () => {
  const React = await import('react');

  return {
    RivePetRenderer: ({
      src,
      onLoadError,
    }: {
      src: string;
      onLoadError?: () => void;
    }) => {
      React.useEffect(() => {
        riveRendererMocks.mountSpy(src);
      }, [src]);

      return (
        <button
          type="button"
          data-testid="mock-rive-renderer"
          data-src={src}
          onClick={() => onLoadError?.()}
        />
      );
    },
  };
});

describe('PetRenderer', () => {
  it('remounts the rive renderer when the role pack changes to a different asset', () => {
    const { rerender } = render(<PetRenderer rolePack="robot" activity="idle" />);

    expect(screen.getByTestId('mock-rive-renderer')).toHaveAttribute(
      'data-src',
      '/assets/pets/robot(1).riv',
    );
    expect(riveRendererMocks.mountSpy).toHaveBeenCalledTimes(1);

    rerender(<PetRenderer rolePack="cat" activity="idle" />);

    expect(screen.getByTestId('mock-rive-renderer')).toHaveAttribute(
      'data-src',
      '/assets/pets/cat(1).riv',
    );
    expect(riveRendererMocks.mountSpy).toHaveBeenCalledTimes(2);
  });

  it('recovers from a previous rive load failure after switching to another role pack', () => {
    const { rerender } = render(<PetRenderer rolePack="robot" activity="idle" />);

    fireEvent.click(screen.getByTestId('mock-rive-renderer'));

    expect(screen.queryByTestId('mock-rive-renderer')).not.toBeInTheDocument();

    rerender(<PetRenderer rolePack="cat" activity="idle" />);

    expect(screen.getByTestId('mock-rive-renderer')).toHaveAttribute(
      'data-src',
      '/assets/pets/cat(1).riv',
    );
  });
});
