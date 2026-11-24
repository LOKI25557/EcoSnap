import { formatDate } from '../formatDate';
import { generateId } from '../helpers';

describe('Shared Utility Helpers', () => {
  describe('formatDate', () => {
    it('formats a Date instance into YYYY-MM-DD string', () => {
      const date = new Date('2026-11-24T12:00:00Z');
      expect(formatDate(date)).toBe('2026-11-24');
    });
  });

  describe('generateId', () => {
    it('generates a non-empty string identifier', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id1).not.toBe(id2);
    });
  });
});
