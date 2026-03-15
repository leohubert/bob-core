import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { newLoader } from '@/src/ux/loader.js';

describe('newLoader', () => {
	let stdoutSpy: any;

	beforeEach(() => {
		vi.useFakeTimers();
		stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
	});

	afterEach(() => {
		stdoutSpy.mockRestore();
		vi.useRealTimers();
	});

	it('should create a loader with default settings', () => {
		const loader = newLoader();

		expect(loader).toHaveProperty('stop');
		expect(loader).toHaveProperty('updateText');
		expect(loader[Symbol.dispose]).toBeDefined();
		expect(loader[Symbol.asyncDispose]).toBeDefined();

		loader.stop();
	});

	it('should animate loader', () => {
		const loader = newLoader('Loading');

		vi.advanceTimersByTime(100);
		vi.advanceTimersByTime(100);
		vi.advanceTimersByTime(100);

		expect(stdoutSpy.mock.calls.length).toBe(3);

		loader.stop();
	});

	it('should stop loader when stop() is called', () => {
		const loader = newLoader('Loading...');

		vi.advanceTimersByTime(100);
		const callCountBeforeStop = stdoutSpy.mock.calls.length;

		loader.stop();
		vi.advanceTimersByTime(200);

		expect(stdoutSpy.mock.calls.length).toBe(callCountBeforeStop + 1);
	});

	it('should update loader text', () => {
		const loader = newLoader('Initial');

		vi.advanceTimersByTime(100);
		loader.updateText('Updated');
		vi.advanceTimersByTime(100);

		loader.stop();
		expect(process.stdout.write).toHaveBeenCalled();
	});

	it('should support Symbol.dispose for cleanup', () => {
		const loader = newLoader('Test');

		vi.advanceTimersByTime(100);
		const callCountBeforeDispose = stdoutSpy.mock.calls.length;

		loader[Symbol.dispose]();
		vi.advanceTimersByTime(200);

		expect(stdoutSpy.mock.calls.length).toBe(callCountBeforeDispose + 1);
	});
});
