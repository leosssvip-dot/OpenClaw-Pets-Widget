import { describe, expect, it } from 'vitest';
import {
  PET_ROLE_PACKS,
  normalizePetAvatarSource,
  resolvePetAppearance
} from '../pet-appearance';

describe('pet appearance helpers', () => {
  it('defines professional role metadata for every built-in pack', () => {
    expect(PET_ROLE_PACKS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'lobster',
          label: 'Coder Claw',
          roleLabel: 'Code'
        }),
        expect.objectContaining({
          id: 'cat',
          label: 'Planner Cat',
          roleLabel: 'Plan'
        }),
        expect.objectContaining({
          id: 'robot',
          label: 'Ops Bot',
          roleLabel: 'Ops'
        }),
        expect.objectContaining({
          id: 'monk',
          label: 'Mokugyo Monk',
          roleLabel: 'Focus'
        })
      ])
    );
  });

  it('resolves built-in role packs into semantic variants', () => {
    expect(
      resolvePetAppearance({ rolePack: 'monk' } as never)
    ).toEqual(
      expect.objectContaining({
        variant: 'monk',
        rolePack: 'monk',
        avatar: null
      })
    );
  });

  it('accepts https, file, data, and absolute local image sources', () => {
    expect(
      normalizePetAvatarSource('https://cdn.example.com/pets/ruby-lobster.svg')
    ).toBe('https://cdn.example.com/pets/ruby-lobster.svg');
    expect(
      normalizePetAvatarSource('file:///Users/testuser/Pictures/ruby-lobster.png')
    ).toBe('file:///Users/testuser/Pictures/ruby-lobster.png');
    expect(
      normalizePetAvatarSource('/Users/testuser/Pictures/ruby-lobster.webp')
    ).toBe('file:///Users/testuser/Pictures/ruby-lobster.webp');
    expect(
      normalizePetAvatarSource('data:image/svg+xml;base64,PHN2Zy8+')
    ).toBe('data:image/svg+xml;base64,PHN2Zy8+');
  });

  it('falls back to the default lobster shell for unsupported avatar values', () => {
    expect(resolvePetAppearance({ avatar: 'ruby-lobster.png' })).toEqual(
      expect.objectContaining({
        variant: 'lobster',
        rolePack: 'lobster',
        avatar: null
      })
    );
  });
});
