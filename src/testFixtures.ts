import {vi, beforeEach, afterEach} from 'vitest';
import {Logger} from '@/src/Logger.js';

export type MockedConsole = {
	consoleLogSpy: ReturnType<typeof vi.spyOn>;
	consoleWarnSpy: ReturnType<typeof vi.spyOn>;
	consoleErrorSpy: ReturnType<typeof vi.spyOn>;
	restore: () => void;
};

/**
 * Creates a mocked logger that suppresses console output during tests
 * @returns Object with spy instances and restore function
 */
export function createMockedLogger(): MockedConsole {
	const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

	return {
		consoleLogSpy,
		consoleWarnSpy,
		consoleErrorSpy,
		restore: () => {
			consoleLogSpy.mockRestore();
			consoleWarnSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		}
	};
}

/**
 * Sets up mocked logger for the entire test suite
 * Call this in a describe block to automatically mock/restore console for all tests
 */
export function setupMockedLogger() {
	let mocked: MockedConsole | null = null;

	beforeEach(() => {
		mocked = createMockedLogger();
	});

	afterEach(() => {
		mocked?.restore();
	});

	return {
		get consoleLogSpy() { return mocked!.consoleLogSpy; },
		get consoleWarnSpy() { return mocked!.consoleWarnSpy; },
		get consoleErrorSpy() { return mocked!.consoleErrorSpy; },
	};
}

/**
 * Creates a mock Logger instance for testing
 * @returns Mocked Logger with spy functions
 */
export function createMockLogger(): Logger {
	return {
		log: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		verbose: vi.fn(),
		setLevel: vi.fn(),
		getLevel: vi.fn().mockReturnValue('info'),
	} as any;
}
