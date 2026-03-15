import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { table } from '@/src/ux/table.js';

describe('table', () => {
	let consoleSpy: any;

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	it('should auto-detect columns from data keys', () => {
		table([
			{ name: 'Alice', age: 30 },
			{ name: 'Bob', age: 25 },
		]);

		expect(consoleSpy).toHaveBeenCalledTimes(4);
		expect(consoleSpy.mock.calls[0][0]).toContain('NAME');
		expect(consoleSpy.mock.calls[0][0]).toContain('AGE');
	});

	it('should use explicit columns with custom headers', () => {
		table([{ name: 'Alice', age: 30 }], [{ key: 'name', header: 'User Name' }]);

		expect(consoleSpy).toHaveBeenCalledTimes(3);
		expect(consoleSpy.mock.calls[0][0]).toContain('User Name');
		expect(consoleSpy.mock.calls[0][0]).not.toContain('AGE');
	});

	it('should not output anything for empty data', () => {
		table([]);
		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it('should truncate overlong values with ellipsis', () => {
		table([{ val: 'a very long string here' }], [{ key: 'val', width: 10 }]);

		const dataRow = consoleSpy.mock.calls[2][0];
		expect(dataRow).toContain('\u2026');
		expect(dataRow.length).toBeLessThanOrEqual(10);
	});

	it('should support right and center alignment', () => {
		table(
			[{ left: 'L', right: 'R', center: 'C' }],
			[
				{ key: 'left', alignment: 'left' },
				{ key: 'right', alignment: 'right' },
				{ key: 'center', alignment: 'center' },
			],
		);

		const dataRow = consoleSpy.mock.calls[2][0];
		expect(dataRow).toContain('    R');
		expect(dataRow).toContain('  C   ');
	});

	it('should apply format function to values', () => {
		table([{ price: 42 }], [{ key: 'price', format: (v) => `$${v}` }]);

		const dataRow = consoleSpy.mock.calls[2][0];
		expect(dataRow).toContain('$42');
	});
});
