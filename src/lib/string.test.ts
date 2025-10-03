import {describe, it, expect} from 'vitest';
import {generateSpace} from '@/src/lib/string.js';

describe('string utilities', () => {
	describe('generateSpace', () => {
		it('should generate correct number of spaces', () => {
			// Array(n).join(' ') creates n-1 spaces
			expect(generateSpace(0)).toBe('    '); // (0 + 5) - 1 = 4 spaces
			expect(generateSpace(1)).toBe('     '); // (1 + 5) - 1 = 5 spaces
			expect(generateSpace(5)).toBe('         '); // (5 + 5) - 1 = 9 spaces
			expect(generateSpace(10)).toBe('              '); // (10 + 5) - 1 = 14 spaces
		});

		it('should add 4 extra spaces to input (due to Array.join)', () => {
			const result = generateSpace(3);
			expect(result.length).toBe(7); // (3 + 5) - 1 = 7
		});

		it('should handle zero correctly', () => {
			const result = generateSpace(0);
			expect(result).toBe('    '); // (0 + 5) - 1 = 4 spaces
			expect(result.length).toBe(4);
		});

		it('should handle large numbers', () => {
			const result = generateSpace(100);
			expect(result.length).toBe(104); // (100 + 5) - 1 = 104
		});

		it('should generate only spaces', () => {
			const result = generateSpace(10);
			expect(result).toMatch(/^ +$/); // Only spaces
		});

		it('should work with negative numbers (edge case)', () => {
			// Array constructor behavior with negative creates empty array
			const result = generateSpace(-1);
			expect(result).toBe('   '); // (0 + 5) - 1 due to max(0, -1+5) = 4-1 = 3
		});
	});
});
