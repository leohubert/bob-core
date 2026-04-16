import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { newLoader } from '@/src/ux/loader.js';

describe('newLoader', () => {
	let stdoutSpy: any;
	let originalIsTTY: boolean | undefined;

	beforeEach(() => {
		vi.useFakeTimers();
		originalIsTTY = process.stdout.isTTY;
		// Default to non-TTY so tests use the write() fallback path
		Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });
		stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
	});

	afterEach(() => {
		stdoutSpy.mockRestore();
		Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, configurable: true });
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

	it('stop() clears using maxTextLength when updateText() was called before interval fires', () => {
		const shortText = 'Short';
		const longText = 'A very long loader text that is much longer than the short one';
		const loader = newLoader(shortText);

		// Interval fires once, writing the short text
		vi.advanceTimersByTime(100);

		// Update to long text, then back to short — interval hasn't fired yet
		loader.updateText(longText);
		loader.updateText(shortText);

		// stop() should clear using maxTextLength (longText.length), not shortText.length
		loader.stop();

		const lastCall = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1][0] as string;
		// The clear string should contain at least longText.length spaces
		expect(lastCall.length).toBeGreaterThanOrEqual(longText.length);
	});

	it('stop() without any interval tick still clears the initial text', () => {
		const text = 'Loading something...';
		const loader = newLoader(text);

		// Stop before any interval tick
		loader.stop();

		const lastCall = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1][0] as string;
		expect(lastCall.length).toBeGreaterThanOrEqual(text.length);
	});
});
