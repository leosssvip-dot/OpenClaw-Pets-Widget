import { describe, it, expect } from 'vitest';
import {
  checkMilestone,
  currentMilestone,
  nextMilestone,
  MERIT_MILESTONES,
  LOBSTER_MILESTONES,
  ROBOT_MILESTONES,
  CAT_MILESTONES,
  ROLE_MILESTONES,
} from '../merit-milestones';

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

    it('uses role-specific milestones when provided', () => {
      const result = checkMilestone(9, 10, LOBSTER_MILESTONES);
      expect(result).not.toBeNull();
      expect(result!.label).toBe('初写代码');

      const robotResult = checkMilestone(9, 10, ROBOT_MILESTONES);
      expect(robotResult!.label).toBe('初次巡检');

      const catResult = checkMilestone(9, 10, CAT_MILESTONES);
      expect(catResult!.label).toBe('初学规划');
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

    it('works with role-specific milestones', () => {
      const result = currentMilestone(150, LOBSTER_MILESTONES);
      expect(result!.label).toBe('代码百行');
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

    it('works with role-specific milestones', () => {
      const result = nextMilestone(50, ROBOT_MILESTONES);
      expect(result!.label).toBe('百次巡逻');
    });
  });

  describe('all milestone arrays', () => {
    const allArrays = [
      { name: 'monk', milestones: MERIT_MILESTONES },
      { name: 'lobster', milestones: LOBSTER_MILESTONES },
      { name: 'robot', milestones: ROBOT_MILESTONES },
      { name: 'cat', milestones: CAT_MILESTONES },
    ];

    for (const { name, milestones } of allArrays) {
      it(`${name} milestones are sorted by ascending threshold`, () => {
        for (let i = 1; i < milestones.length; i++) {
          expect(milestones[i].threshold).toBeGreaterThan(
            milestones[i - 1].threshold
          );
        }
      });

      it(`${name} milestones have exactly 9 entries`, () => {
        expect(milestones).toHaveLength(9);
      });
    }
  });

  it('ROLE_MILESTONES maps all four roles', () => {
    expect(ROLE_MILESTONES.monk).toBe(MERIT_MILESTONES);
    expect(ROLE_MILESTONES.lobster).toBe(LOBSTER_MILESTONES);
    expect(ROLE_MILESTONES.robot).toBe(ROBOT_MILESTONES);
    expect(ROLE_MILESTONES.cat).toBe(CAT_MILESTONES);
  });
});
