import {describe, it, expect} from 'vitest';
import {convertValue} from '@/src/lib/valueConverter.js';
import {BadCommandOption} from '@/src/errors/BadCommandOption.js';

describe('valueConverter', () => {
	describe('String conversion', () => {
		it('should convert to string', () => {
			expect(convertValue('test', 'string', 'opt')).toBe('test');
			expect(convertValue(123, 'string', 'opt')).toBe('123');
			expect(convertValue(true, 'string', 'opt')).toBe('true');
		});

		it('should return default for null/undefined', () => {
			expect(convertValue(null, 'string', 'opt', 'default')).toBe('default');
			expect(convertValue(undefined, 'string', 'opt', 'default')).toBe('default');
		});

		it('should return null for null/undefined without default', () => {
			expect(convertValue(null, 'string', 'opt')).toBe(null);
			expect(convertValue(undefined, 'string', 'opt')).toBe(null);
		});
	});

	describe('Number conversion', () => {
		it('should convert to number', () => {
			expect(convertValue('42', 'number', 'opt')).toBe(42);
			expect(convertValue(42, 'number', 'opt')).toBe(42);
			expect(convertValue('3.14', 'number', 'opt')).toBe(3.14);
		});

		it('should handle negative numbers', () => {
			expect(convertValue('-42', 'number', 'opt')).toBe(-42);
			expect(convertValue(-42, 'number', 'opt')).toBe(-42);
		});

		it('should handle zero', () => {
			expect(convertValue('0', 'number', 'opt')).toBe(0);
			expect(convertValue(0, 'number', 'opt')).toBe(0);
		});

		it('should throw error for invalid number', () => {
			expect(() => convertValue('not-a-number', 'number', 'opt'))
				.toThrow(BadCommandOption);
		});

		it('should return default for null/undefined', () => {
			expect(convertValue(null, 'number', 'opt', 100)).toBe(100);
			expect(convertValue(undefined, 'number', 'opt', 100)).toBe(100);
		});
	});

	describe('Boolean conversion', () => {
		it('should convert boolean values', () => {
			expect(convertValue(true, 'boolean', 'opt')).toBe(true);
			expect(convertValue(false, 'boolean', 'opt')).toBe(false);
		});

		it('should convert string "true" to true', () => {
			expect(convertValue('true', 'boolean', 'opt')).toBe(true);
		});

		it('should convert string "false" to false', () => {
			expect(convertValue('false', 'boolean', 'opt')).toBe(false);
		});

		it('should convert "1" to true', () => {
			expect(convertValue('1', 'boolean', 'opt')).toBe(true);
		});

		it('should convert "0" to false', () => {
			expect(convertValue('0', 'boolean', 'opt')).toBe(false);
		});

		it('should use Boolean() for other values', () => {
			expect(convertValue('yes', 'boolean', 'opt')).toBe(true);
			expect(convertValue('', 'boolean', 'opt')).toBe(false);
		});

		it('should return default for null/undefined', () => {
			expect(convertValue(null, 'boolean', 'opt', true)).toBe(true);
			expect(convertValue(undefined, 'boolean', 'opt', false)).toBe(false);
		});
	});

	describe('String array conversion', () => {
		it('should convert array of strings', () => {
			expect(convertValue(['a', 'b', 'c'], ['string'], 'opt'))
				.toEqual(['a', 'b', 'c']);
		});

		it('should convert single value to array', () => {
			expect(convertValue('test', ['string'], 'opt'))
				.toEqual(['test']);
		});

		it('should convert numbers to strings in array', () => {
			expect(convertValue([1, 2, 3], ['string'], 'opt'))
				.toEqual(['1', '2', '3']);
		});
	});

	describe('Number array conversion', () => {
		it('should convert array of numbers', () => {
			expect(convertValue([1, 2, 3], ['number'], 'opt'))
				.toEqual([1, 2, 3]);
		});

		it('should convert string numbers to number array', () => {
			expect(convertValue(['1', '2', '3'], ['number'], 'opt'))
				.toEqual([1, 2, 3]);
		});

		it('should convert single value to number array', () => {
			expect(convertValue('42', ['number'], 'opt'))
				.toEqual([42]);
		});

		it('should throw error for invalid number in array', () => {
			expect(() => convertValue(['1', 'invalid', '3'], ['number'], 'opt'))
				.toThrow(BadCommandOption);
		});
	});

	describe('Default values', () => {
		it('should use default for null value', () => {
			expect(convertValue(null, 'string', 'opt', 'default')).toBe('default');
			expect(convertValue(null, 'number', 'opt', 42)).toBe(42);
			expect(convertValue(null, 'boolean', 'opt', true)).toBe(true);
		});

		it('should use default for undefined value', () => {
			expect(convertValue(undefined, 'string', 'opt', 'default')).toBe('default');
			expect(convertValue(undefined, 'number', 'opt', 42)).toBe(42);
			expect(convertValue(undefined, 'boolean', 'opt', false)).toBe(false);
		});

		it('should return null when no default provided', () => {
			expect(convertValue(null, 'string', 'opt')).toBe(null);
			expect(convertValue(undefined, 'number', 'opt')).toBe(null);
		});
	});

	describe('Edge cases', () => {
		it('should handle empty string', () => {
			expect(convertValue('', 'string', 'opt')).toBe('');
		});

		it('should handle zero as valid number', () => {
			expect(convertValue(0, 'number', 'opt')).toBe(0);
		});

		it('should handle empty array', () => {
			expect(convertValue([], ['string'], 'opt')).toEqual([]);
		});
	});
});
