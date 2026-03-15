import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { newProgressBar } from '@/src/ux/progressBar.js';

describe('newProgressBar', () => {
	let stdoutSpy: any;

	beforeEach(() => {
		stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
	});

	afterEach(() => {
		stdoutSpy.mockRestore();
	});

	it('should return a disposable object with expected shape', () => {
		const bar = newProgressBar(10);

		expect(bar).toHaveProperty('increment');
		expect(bar).toHaveProperty('update');
		expect(bar).toHaveProperty('stop');
		expect(bar[Symbol.dispose]).toBeDefined();
		expect(bar[Symbol.asyncDispose]).toBeDefined();

		bar.stop();
	});

	it('should render on increment', () => {
		const bar = newProgressBar(10);
		stdoutSpy.mockClear();

		bar.increment();

		expect(stdoutSpy).toHaveBeenCalled();
		const output = stdoutSpy.mock.calls[0][0];
		expect(output).toContain('10%');
		expect(output).toContain('1/10');

		bar.stop();
	});

	it('should render on update', () => {
		const bar = newProgressBar(10);
		stdoutSpy.mockClear();

		bar.update(5);

		const output = stdoutSpy.mock.calls[0][0];
		expect(output).toContain('50%');
		expect(output).toContain('5/10');

		bar.stop();
	});

	it('should clamp value to total', () => {
		const bar = newProgressBar(10);
		stdoutSpy.mockClear();

		bar.update(20);

		const output = stdoutSpy.mock.calls[0][0];
		expect(output).toContain('100%');
		expect(output).toContain('10/10');

		bar.stop();
	});

	it('should handle total=0 as 100% complete', () => {
		const bar = newProgressBar(0);

		const output = stdoutSpy.mock.calls[0][0];
		expect(output).toContain('100%');

		bar.stop();
	});

	it('should be a no-op after stop', () => {
		const bar = newProgressBar(10);
		bar.stop();
		stdoutSpy.mockClear();

		bar.increment();
		bar.update(5);

		expect(stdoutSpy).not.toHaveBeenCalled();
	});

	it('should support custom chars and width', () => {
		const bar = newProgressBar(2, {
			width: 4,
			completeChar: '#',
			incompleteChar: '.',
		});

		bar.update(1);

		const output = stdoutSpy.mock.calls[1][0];
		expect(output).toContain('##..');

		bar.stop();
	});
});
