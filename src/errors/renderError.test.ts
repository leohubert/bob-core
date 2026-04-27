import { describe, expect, it, vi } from 'vitest';

import type { LoggerContract } from '@/src/contracts/index.js';
import { renderError } from '@/src/errors/renderError.js';

function newLogger(): LoggerContract & { log: any } {
	return {
		log: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		setLevel: vi.fn(),
		getLevel: vi.fn().mockReturnValue('info'),
	};
}

const stripAnsi = (s: string): string => s.replace(/\x1b\[[0-9;]*m/g, ''); // eslint-disable-line no-control-regex

describe('renderError', () => {
	it('renders a bare title with no gutter when there are no details or hints', () => {
		const logger = newLogger();
		renderError(logger, { title: 'something went wrong' });
		const out = logger.log.mock.calls.map((c: any) => stripAnsi(c[0])).join('\n');
		expect(out).toContain('error: something went wrong');
		expect(out).not.toContain('│');
	});

	it('renders details with a gutter and aligns labels by visible width (ignoring ANSI codes)', () => {
		const logger = newLogger();
		renderError(logger, {
			title: 'broken',
			details: [
				['short', 'a'],
				['much-longer-label', 'b'],
			],
		});
		const calls = logger.log.mock.calls.map((c: any) => stripAnsi(c[0]));
		const detailLines = calls.filter((l: string) => l.includes('│  ') && (l.includes(' a') || l.includes(' b')));
		expect(detailLines).toHaveLength(2);
		// Both lines should align — the value column lands at the same offset in both.
		const valueOffsets = detailLines.map((l: string) => (l.indexOf('  a') >= 0 ? l.indexOf('  a') : l.indexOf('  b')));
		expect(valueOffsets[0]).toBe(valueOffsets[1]);
	});

	it('renders hint with the corner glyph when provided', () => {
		const logger = newLogger();
		renderError(logger, { title: 'oops', hint: 'try --help' });
		const out = logger.log.mock.calls.map((c: any) => stripAnsi(c[0])).join('\n');
		expect(out).toContain('try: try --help');
		expect(out).toContain('└─');
	});
});
