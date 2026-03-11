import { describe, expect, it } from 'vitest';
import { resolvePetAnimationState } from '../pet-animation-state';

describe('pet animation state', () => {
  it('maps working and collaborating pets into focused work activity', () => {
    expect(
      resolvePetAnimationState({
        petStatus: 'working',
        connectionStatus: 'connected'
      })
    ).toEqual(
      expect.objectContaining({
        activity: 'working',
        mood: 'focused'
      })
    );

    expect(
      resolvePetAnimationState({
        petStatus: 'collaborating',
        connectionStatus: 'connected'
      })
    ).toEqual(
      expect.objectContaining({
        activity: 'working',
        mood: 'focused'
      })
    );
  });

  it('maps successful and failed outcomes into readable emotional moods', () => {
    expect(
      resolvePetAnimationState({
        petStatus: 'done',
        connectionStatus: 'connected'
      })
    ).toEqual(
      expect.objectContaining({
        activity: 'done',
        mood: 'proud'
      })
    );

    expect(
      resolvePetAnimationState({
        petStatus: 'blocked',
        connectionStatus: 'connected'
      })
    ).toEqual(
      expect.objectContaining({
        activity: 'blocked',
        mood: 'concerned'
      })
    );
  });

  it('treats disconnected surfaces as blocked and concerned regardless of pet status', () => {
    expect(
      resolvePetAnimationState({
        petStatus: 'idle',
        connectionStatus: 'offline'
      })
    ).toEqual(
      expect.objectContaining({
        activity: 'blocked',
        mood: 'concerned'
      })
    );
  });
});
