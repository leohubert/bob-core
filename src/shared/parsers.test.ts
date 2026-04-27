import { describe, expect, it } from 'vitest';

import { ValidationError } from '@/src/errors/ValidationError.js';
import { parseBoolean, parseDirectory, parseFile, parseNumber, parseOption, parseString, parseUrl } from '@/src/shared/parsers.js';

describe('parsers', () => {
	describe('parseString', () => {
		it('throws ValidationError (not bare Error) when given a boolean', () => {
			expect(() => parseString(true)).toThrow(ValidationError);
		});
		it('returns string input unchanged', () => {
			expect(parseString('hello')).toBe('hello');
		});
	});

	describe('parseNumber', () => {
		it('throws ValidationError for non-numeric strings', () => {
			expect(() => parseNumber('nope')).toThrow(ValidationError);
		});
		it('clamps below min', () => {
			expect(() => parseNumber(0, { min: 1 })).toThrow(/below minimum/);
		});
		it('clamps above max', () => {
			expect(() => parseNumber(99, { max: 10 })).toThrow(/exceeds maximum/);
		});
	});

	describe('parseBoolean', () => {
		it('accepts true/false/0/1 strings', () => {
			expect(parseBoolean('true')).toBe(true);
			expect(parseBoolean('false')).toBe(false);
			expect(parseBoolean('1')).toBe(true);
			expect(parseBoolean('0')).toBe(false);
		});
		it('rejects unrecognized values with ValidationError', () => {
			expect(() => parseBoolean('maybe')).toThrow(ValidationError);
		});
	});

	describe('parseOption', () => {
		it('rejects out-of-set values', () => {
			expect(() => parseOption('c', ['a', 'b'] as const)).toThrow(/must be one of/);
		});
	});

	describe('parseFile', () => {
		it('does nothing when exists check is off', () => {
			expect(parseFile('/this/does/not/exist')).toBe('/this/does/not/exist');
		});
		it('reports a specific message when the path is missing', () => {
			expect(() => parseFile('/this/does/not/exist', { exists: true })).toThrow('file does not exist');
		});
	});

	describe('parseDirectory', () => {
		it('does nothing when exists check is off', () => {
			expect(parseDirectory('/this/does/not/exist')).toBe('/this/does/not/exist');
		});
		it('reports the right message for missing path', () => {
			expect(() => parseDirectory('/this/does/not/exist', { exists: true })).toThrow('directory does not exist');
		});
		it('rejects existing files (not directories) with a clear message', () => {
			// /etc/hosts exists on darwin/linux and is not a directory.
			expect(() => parseDirectory('/etc/hosts', { exists: true })).toThrow('path is not a directory');
		});
	});

	describe('parseUrl', () => {
		it('returns a URL object for valid input', () => {
			expect(parseUrl('https://example.com/x').toString()).toBe('https://example.com/x');
		});
		it('includes the underlying error message in ValidationError', () => {
			let caught: Error | null = null;
			try {
				parseUrl('not-a-url');
			} catch (e) {
				caught = e as Error;
			}
			expect(caught).toBeInstanceOf(ValidationError);
			expect(caught!.message).toContain('not-a-url');
			// The underlying URL error message is propagated, not swallowed.
			expect(caught!.message.length).toBeGreaterThan('Invalid URL "not-a-url":'.length);
		});
	});
});
