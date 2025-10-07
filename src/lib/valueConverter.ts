import { BadCommandOption } from '@/src/errors/index.js';
import { OptionPrimitive } from '@/src/lib/types.js';

/**
 * Converts a value to the specified type with validation
 * @param value - The value to convert
 * @param type - The target type
 * @param name - The parameter name (for error messages)
 * @param defaultValue - Optional default value if value is null/undefined
 * @returns The converted value
 */
export function convertValue(value: unknown, type: OptionPrimitive, name: string, defaultValue?: unknown): unknown {
	if (value === null || value === undefined) {
		return defaultValue ?? null;
	}

	if (type === 'string') {
		return String(value);
	}

	if (type === 'number') {
		const num = Number(value);
		if (isNaN(num)) {
			throw new BadCommandOption({
				option: name,
				reason: `Expected a number, got "${value}"`,
			});
		}
		return num;
	}

	if (type === 'boolean') {
		if (typeof value === 'boolean') return value;
		if (value === 'true' || value === '1') return true;
		if (value === 'false' || value === '0') return false;
		return Boolean(value);
	}

	if (Array.isArray(type)) {
		const elementType = type[0];
		const arrayValue = Array.isArray(value) ? value : [value];

		if (elementType === 'string') {
			return arrayValue.map(v => String(v));
		}

		if (elementType === 'number') {
			return arrayValue.map(v => {
				const num = Number(v);
				if (isNaN(num)) {
					throw new BadCommandOption({
						option: name,
						reason: `Expected array of numbers, got "${v}" in array`,
					});
				}
				return num;
			});
		}
	}

	return value;
}
