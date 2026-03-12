import { describe, it, expect } from 'vitest';
import { checkMilestone, currentMilestone, nextMilestone, MERIT_MILESTONES } from '../merit-milestones';

describe('merit-milestones', () => {
  describe('checkMilestone', () => {
    it('returns null when no milestone is crossed', () => {
      expect(checkMilestone(5, 6)).toBeNull();
      expect(checkMilestone(0, 9)).toBeNull();
    });

    it('detects when the first milestone is crossed', () => {
      const result = checkMilestone(9, 10);
      expect(result).not.toBeNull();
      expect(result!.threshold).toBe(10);
      expect(result!.label).toBe('初入佛门');
    });

    it('detects crossing the 100 milestone', () => {
      const result = checkMilestone(99, 100);
      expect(result).not.toBeNull();
      expect(result!.threshold).toBe(100);
      expect(result!.tier).toBe('silver');
    });

    it('returns the highest milestone when jumping across multiple', () => {
      const result = checkMilestone(0, 1000);
      expect(result).not.toBeNull();
      expect(result!.threshold).toBe(1000);
      expect(result!.label).toBe('功德千秋');
    });

    it('returns null when already past all milestones', () => {
      expect(checkMilestone(100001, 100002)).toBeNull();
    });
  });

  describe('currentMilestone', () => {
    it('returns null for zero count', () => {
      expect(currentMilestone(0)).toBeNull();
    });

    it('returns the highest achieved milestone', () => {
      const result = currentMilestone(150);
      expect(result).not.toBeNull();
      expect(result!.threshold).toBe(100);
    });

    it('returns diamond tier for very high counts', () => {
      const result = currentMilestone(100000);
      expect(result).not.toBeNull();
      expect(result!.tier).toBe('diamond');
    });
  });

  describe('nextMilestone', () => {
    it('returns the first milestone for zero count', () => {
      const result = nextMilestone(0);
      expect(result).not.toBeNull();
      expect(result!.threshold).toBe(10);
    });

    it('returns the next unachieved milestone', () => {
      const result = nextMilestone(50);
      expect(result).not.toBeNull();
      expect(result!.threshold).toBe(100);
    });

    it('returns null when all milestones achieved', () => {
      expect(nextMilestone(100000)).toBeNull();
    });
  });

  it('milestones are sorted by ascending threshold', () => {
    for (let i = 1; i < MERIT_MILESTONES.length; i++) {
      expect(MERIT_MILESTONES[i].threshold).toBeGreaterThan(
        MERIT_MILESTONES[i - 1].threshold
      );
    }
  });
});
