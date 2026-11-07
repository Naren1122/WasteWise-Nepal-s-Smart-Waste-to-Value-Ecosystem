import { describe, it, expect } from 'vitest';
import {
  toPaisa,
  toNpr,
  roundNpr,
  calculateItemTotal,
  formatNprDisplay,
} from '../currency.util.js';

describe('Currency & Monetary Calculations Utility', () => {
  describe('toPaisa', () => {
    it('should convert standard NPR amount to integer Paisa', () => {
      expect(toPaisa(150)).toBe(15000);
      expect(toPaisa(250.75)).toBe(25075);
      expect(toPaisa('99.99')).toBe(9999);
      expect(toPaisa(0)).toBe(0);
    });

    it('should eliminate floating-point drift (e.g. 0.1 + 0.2)', () => {
      const sum = 0.1 + 0.2; // 0.30000000000000004
      expect(toPaisa(sum)).toBe(30);
    });

    it('should throw on negative or invalid amount', () => {
      expect(() => toPaisa(-10)).toThrow('Invalid monetary amount');
      expect(() => toPaisa('invalid')).toThrow('Invalid monetary amount');
    });
  });

  describe('toNpr', () => {
    it('should convert integer Paisa to NPR with 2 decimal precision', () => {
      expect(toNpr(15000)).toBe(150);
      expect(toNpr(25075)).toBe(250.75);
      expect(toNpr(9999)).toBe(99.99);
      expect(toNpr(0)).toBe(0);
    });

    it('should throw on negative or invalid paisa', () => {
      expect(() => toNpr(-5)).toThrow('Invalid paisa amount');
    });
  });

  describe('calculateItemTotal', () => {
    it('should accurately calculate total line price without float errors', () => {
      expect(calculateItemTotal(3, 150.5)).toBe(451.5);
      expect(calculateItemTotal(1, 99.99)).toBe(99.99);
      expect(calculateItemTotal(10, 25.25)).toBe(252.5);
    });
  });

  describe('formatNprDisplay', () => {
    it('should format amounts with Rs. prefix and Indian/Nepali grouping', () => {
      const formatted = formatNprDisplay(150000);
      expect(formatted).toContain('1,50,000.00');
    });
  });
});

