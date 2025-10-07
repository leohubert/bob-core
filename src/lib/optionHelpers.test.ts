import { describe, expect, it } from 'vitest';

import { getOptionDefaultValue, getOptionDetails, getOptionPrimitiveDefaultValue } from '@/src/lib/optionHelpers.js';
import { Option } from '@/src/lib/types.js';

describe('optionHelpers', () => {
	describe('getOptionPrimitiveDefaultValue', () => {
		it('should return null for string type', () => {
			expect(getOptionPrimitiveDefaultValue('string')).toBe(null);
		});

		it('should return null for number type', () => {
			expect(getOptionPrimitiveDefaultValue('number')).toBe(null);
		});

		it('should return false for boolean type', () => {
			expect(getOptionPrimitiveDefaultValue('boolean')).toBe(false);
		});

		it('should return empty array for string array type', () => {
			expect(getOptionPrimitiveDefaultValue(['string'])).toEqual([]);
		});

		it('should return empty array for number array type', () => {
			expect(getOptionPrimitiveDefaultValue(['number'])).toEqual([]);
		});
	});

	describe('getOptionDefaultValue', () => {
		it('should return default for primitive string', () => {
			expect(getOptionDefaultValue('string')).toBe(null);
		});

		it('should return default for primitive number', () => {
			expect(getOptionDefaultValue('number')).toBe(null);
		});

		it('should return default for primitive boolean', () => {
			expect(getOptionDefaultValue('boolean')).toBe(false);
		});

		it('should return empty array for array type', () => {
			expect(getOptionDefaultValue(['string'])).toEqual([]);
		});

		it('should use custom default from option definition', () => {
			expect(
				getOptionDefaultValue({
					type: 'string',
					default: 'custom',
				}),
			).toBe('custom');
		});

		it('should use custom numeric default', () => {
			expect(
				getOptionDefaultValue({
					type: 'number',
					default: 42,
				}),
			).toBe(42);
		});

		it('should use primitive default when no custom default', () => {
			expect(
				getOptionDefaultValue({
					type: 'boolean',
				}),
			).toBe(false);
		});
	});

	describe('getOptionDetails', () => {
		it('should extract details from primitive string', () => {
			const details = getOptionDetails('string');

			expect(details).toEqual({
				type: 'string',
				default: null,
				description: '',
				alias: [],
				required: false,
				variadic: false,
			});
		});

		it('should extract details from primitive number', () => {
			const details = getOptionDetails('number');

			expect(details).toEqual({
				type: 'number',
				default: null,
				description: '',
				alias: [],
				required: false,
				variadic: false,
			});
		});

		it('should extract details from primitive boolean', () => {
			const details = getOptionDetails('boolean');

			expect(details).toEqual({
				type: 'boolean',
				default: false,
				description: '',
				alias: [],
				required: false,
				variadic: false,
			});
		});

		it('should extract details from array type', () => {
			const details = getOptionDetails(['string']);

			expect(details).toEqual({
				type: ['string'],
				default: [],
				description: '',
				alias: [],
				required: false,
				variadic: false,
			});
		});

		it('should extract details from full option definition', () => {
			const option: Option = {
				type: 'string',
				description: 'Test option',
				alias: 'o',
				required: true,
				default: 'test',
				variadic: false,
			};

			const details = getOptionDetails(option);

			expect(details).toEqual({
				type: 'string',
				description: 'Test option',
				alias: ['o'],
				required: true,
				default: 'test',
				variadic: false,
			});
		});

		it('should convert string alias to array', () => {
			const option: Option = {
				type: 'string',
				alias: 'o',
			};

			const details = getOptionDetails(option);

			expect(details.alias).toEqual(['o']);
		});

		it('should keep array alias as is', () => {
			const option: Option = {
				type: 'string',
				alias: ['o', 'opt', 'option'],
			};

			const details = getOptionDetails(option);

			expect(details.alias).toEqual(['o', 'opt', 'option']);
		});

		it('should handle empty alias', () => {
			const option: Option = {
				type: 'string',
			};

			const details = getOptionDetails(option);

			expect(details.alias).toEqual([]);
		});

		it('should use primitive default when option has no default', () => {
			const option: Option = {
				type: 'boolean',
				description: 'Test',
			};

			const details = getOptionDetails(option);

			expect(details.default).toBe(false);
		});

		it('should use option default over primitive default', () => {
			const option: Option = {
				type: 'boolean',
				default: true,
			};

			const details = getOptionDetails(option);

			expect(details.default).toBe(true);
		});

		it('should handle variadic flag', () => {
			const option: Option = {
				type: ['string'],
				variadic: true,
			};

			const details = getOptionDetails(option);

			expect(details.variadic).toBe(true);
		});

		it('should default variadic to false', () => {
			const option: Option = {
				type: 'string',
			};

			const details = getOptionDetails(option);

			expect(details.variadic).toBe(false);
		});

		it('should default required to false', () => {
			const option: Option = {
				type: 'string',
			};

			const details = getOptionDetails(option);

			expect(details.required).toBe(false);
		});

		it('should handle empty description', () => {
			const option: Option = {
				type: 'string',
			};

			const details = getOptionDetails(option);

			expect(details.description).toBe('');
		});
	});
});
