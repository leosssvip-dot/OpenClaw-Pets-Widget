import { describe, expect, it } from 'vitest';
import {
  normalizePetAvatarSource,
  resolvePetAppearance
} from '../pet-appearance';

describe('pet appearance helpers', () => {
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
      normalizePetAvatarSource('file:///Users/chenyang/Pictures/ruby-lobster.png')
    ).toBe('file:///Users/chenyang/Pictures/ruby-lobster.png');
    expect(
      normalizePetAvatarSource('/Users/chenyang/Pictures/ruby-lobster.webp')
    ).toBe('file:///Users/chenyang/Pictures/ruby-lobster.webp');
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
