import chalk from 'chalk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { keyValue } from '@/src/ux/keyValue.js';

describe('keyValue', () => {
	let consoleSpy: any;

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	it('should render key-value pairs from an object', () => {
		keyValue({ name: 'Alice', role: 'Admin' });

		expect(consoleSpy).toHaveBeenCalledTimes(2);
		expect(consoleSpy.mock.calls[0][0]).toContain('name');
		expect(consoleSpy.mock.calls[0][0]).toContain('Alice');
	});

	it('should render key-value pairs from a tuple array', () => {
		keyValue([
			['host', 'localhost'],
			['port', 3000],
		]);

		expect(consoleSpy).toHaveBeenCalledTimes(2);
		expect(consoleSpy.mock.calls[0][0]).toContain('host');
		expect(consoleSpy.mock.calls[1][0]).toContain('3000');
	});

	it('should pad keys to max key width', () => {
		keyValue({ a: '1', longkey: '2' });

		expect(consoleSpy.mock.calls[0][0]).toContain(chalk.bold('a      '));
		expect(consoleSpy.mock.calls[1][0]).toContain(chalk.bold('longkey'));
	});

	it('should not output anything for empty input', () => {
		keyValue({});
		expect(consoleSpy).not.toHaveBeenCalled();

		keyValue([]);
		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it('should use custom separator and key style', () => {
		const keyStyle = (key: string) => `[${key}]`;
		keyValue({ name: 'Bob' }, { separator: ' = ', keyStyle });

		expect(consoleSpy.mock.calls[0][0]).toBe('[name] = Bob');
	});
});
