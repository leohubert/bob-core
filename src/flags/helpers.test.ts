import { describe, expect, it } from 'vitest';

import { buildInputValidator, buildMultipleValuesValidator, formatPromptMessage } from '@/src/flags/helpers.js';
import { Flags } from '@/src/flags/index.js';
import type { FlagDefinition } from '@/src/lib/types.js';

describe('helpers', () => {
	describe('formatPromptMessage', () => {
		it('should include the flag name', () => {
			const def = Flags.string({ description: 'A name' }) as FlagDefinition;
			const msg = formatPromptMessage('name', def);
			expect(msg).toContain('name');
		});

		it('should include the description', () => {
			const def = Flags.string({ description: 'User name' }) as FlagDefinition;
			const msg = formatPromptMessage('name', def);
			expect(msg).toContain('User name');
		});

		it('should show [] for multiple', () => {
			const def = Flags.string({ multiple: true }) as FlagDefinition;
			const msg = formatPromptMessage('tags', def);
			expect(msg).toContain('string[]');
		});
	});

	describe('buildInputValidator', () => {
		it('should require value when definition is required', () => {
			const def = Flags.string({ required: true }) as FlagDefinition;
			const validator = buildInputValidator(def);
			expect(validator('')).toBe('This value is required');
		});

		it('should pass for valid string input', () => {
			const def = Flags.string() as FlagDefinition;
			const validator = buildInputValidator(def);
			expect(validator('hello')).toBe(true);
		});

		it('should catch enum validation in parse', () => {
			const def = Flags.enum({ options: ['a', 'b'] as const }) as FlagDefinition;
			const validator = buildInputValidator(def);
			expect(validator('a')).toBe(true);
			expect(validator('c')).toContain('must be one of');
		});

		it('should catch parse errors', () => {
			const def = Flags.url() as FlagDefinition;
			const validator = buildInputValidator(def);
			expect(validator('not-a-url')).toBeTruthy();
			expect(validator('not-a-url')).not.toBe(true);
		});

		it('should catch min/max validation in parse', () => {
			const def = Flags.number({ min: 10 }) as FlagDefinition;
			const validator = buildInputValidator(def);
			expect(validator('5')).toBe('is below minimum 10');
			expect(validator('15')).toBe(true);
		});
	});

	describe('buildMultipleValuesValidator', () => {
		it('should reject items below min for number flags', () => {
			const def = Flags.number({ min: 5, multiple: true }) as FlagDefinition;
			const validator = buildMultipleValuesValidator(def);
			expect(validator('3')).toBe('"3": is below minimum 5');
			expect(validator('10')).toBe(true);
		});

		it('should reject items above max for number flags', () => {
			const def = Flags.number({ max: 100, multiple: true }) as FlagDefinition;
			const validator = buildMultipleValuesValidator(def);
			expect(validator('200')).toBe('"200": exceeds maximum 100');
			expect(validator('50')).toBe(true);
		});

		it('should catch non-numeric input as parse error', () => {
			const def = Flags.number({ multiple: true }) as FlagDefinition;
			const validator = buildMultipleValuesValidator(def);
			const result = validator('abc');
			expect(result).toContain('"abc"');
			expect(result).not.toBe(true);
		});

		it('should reject invalid enum items via parse', () => {
			const def = Flags.enum({ options: ['a', 'b'] as const, multiple: true }) as FlagDefinition;
			const validator = buildMultipleValuesValidator(def);
			expect(validator('c')).toContain('"c"');
			expect(validator('c')).toContain('must be one of');
			expect(validator('a')).toBe(true);
		});

		it('should validate each item individually and report the offending one', () => {
			const def = Flags.number({ min: 1, max: 100, multiple: true }) as FlagDefinition;
			const validator = buildMultipleValuesValidator(def);
			const result = validator('1,abc,3');
			expect(result).toContain('"abc"');
			expect(result).not.toContain('"1"');
			expect(result).not.toContain('"3"');
		});

		it('should skip empty segments', () => {
			const def = Flags.number({ min: 1, multiple: true }) as FlagDefinition;
			const validator = buildMultipleValuesValidator(def);
			expect(validator('5,,10')).toBe(true);
		});

		it('should require value when definition is required', () => {
			const def = Flags.string({ required: true, multiple: true }) as FlagDefinition;
			const validator = buildMultipleValuesValidator(def);
			expect(validator('')).toBe('Please enter at least one value');
		});

		it('should pass valid comma-separated values', () => {
			const def = Flags.string({ multiple: true }) as FlagDefinition;
			const validator = buildMultipleValuesValidator(def);
			expect(validator('foo,bar,baz')).toBe(true);
		});
	});
});
