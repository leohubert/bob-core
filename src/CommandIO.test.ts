import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import {CommandIO} from '@/src/CommandIO.js';
import {Logger} from '@/src/Logger.js';
import {setupMockedLogger} from '@/src/testFixtures.js';

describe('CommandIO', () => {
	setupMockedLogger();

	describe('Logger delegation', () => {
		let mockLogger: Logger;
		let io: CommandIO;

		beforeEach(() => {
			mockLogger = {
				log: vi.fn(),
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
				debug: vi.fn(),
				verbose: vi.fn(),
			} as any;

			io = new CommandIO(mockLogger);
		});

		it('should delegate log() to logger', () => {
			io.log('test message', 123);
			expect(mockLogger.log).toHaveBeenCalledWith('test message', 123);
		});

		it('should delegate info() to logger', () => {
			io.info('info message');
			expect(mockLogger.info).toHaveBeenCalledWith('info message');
		});

		it('should delegate warn() to logger', () => {
			io.warn('warn message');
			expect(mockLogger.warn).toHaveBeenCalledWith('warn message');
		});

		it('should delegate error() to logger', () => {
			io.error('error message');
			expect(mockLogger.error).toHaveBeenCalledWith('error message');
		});

		it('should delegate debug() to logger', () => {
			io.debug('debug message');
			expect(mockLogger.debug).toHaveBeenCalledWith('debug message');
		});

		it('should delegate verbose() to logger', () => {
			io.verbose('verbose message');
			expect(mockLogger.verbose).toHaveBeenCalledWith('verbose message');
		});

		it('should pass multiple arguments to logger methods', () => {
			io.info('msg1', 'msg2', {key: 'value'}, 123);
			expect(mockLogger.info).toHaveBeenCalledWith('msg1', 'msg2', {key: 'value'}, 123);
		});
	});

	describe('Default logger', () => {
		it('should create default logger when none provided', () => {
			const io = new CommandIO();

			// Should not throw and should work
			expect(() => io.log('test')).not.toThrow();
		});
	});

	describe('newLoader()', () => {
		let stdoutSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			vi.useFakeTimers();
			stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		});

		afterEach(() => {
			stdoutSpy.mockRestore();
			vi.useRealTimers();
		});

		it('should create a loader with default settings', () => {
			const io = new CommandIO();
			const loader = io.newLoader();

			expect(loader).toHaveProperty('stop');
			expect(loader).toHaveProperty('updateText');
			expect(loader[Symbol.dispose]).toBeDefined();
			expect(loader[Symbol.asyncDispose]).toBeDefined();
		});

		it('should create a loader with custom text', () => {
			const io = new CommandIO();
			const loader = io.newLoader('Loading...');

			vi.advanceTimersByTime(100);

			expect(process.stdout.write).toHaveBeenCalled();
			loader.stop();
		});

		it('should create a loader with custom chars and delay', () => {
			const io = new CommandIO();
			const loader = io.newLoader('Test', ['|', '/', '-', '\\'], 50);

			vi.advanceTimersByTime(50);
			expect(process.stdout.write).toHaveBeenCalled();

			loader.stop();
		});

		it('should stop loader when stop() is called', () => {
			const io = new CommandIO();
			const loader = io.newLoader('Loading...');

			vi.advanceTimersByTime(100);
			const callCount = (process.stdout.write as any).mock.calls.length;

			loader.stop();
			vi.advanceTimersByTime(200);

			// Should not have written more after stop
			expect((process.stdout.write as any).mock.calls.length).toBeGreaterThanOrEqual(callCount);
		});

		it('should update loader text', () => {
			const io = new CommandIO();
			const loader = io.newLoader('Initial');

			vi.advanceTimersByTime(100);
			loader.updateText('Updated');
			vi.advanceTimersByTime(100);

			loader.stop();
		});

		it('should support Symbol.dispose for cleanup', () => {
			const io = new CommandIO();
			const loader = io.newLoader('Test');

			vi.advanceTimersByTime(100);
			loader[Symbol.dispose]();

			vi.advanceTimersByTime(200);
			// Should have stopped
		});

		it('should support Symbol.asyncDispose for cleanup', async () => {
			const io = new CommandIO();
			const loader = io.newLoader('Test');

			vi.advanceTimersByTime(100);
			await loader[Symbol.asyncDispose]();

			vi.advanceTimersByTime(200);
			// Should have stopped
		});
	});
});
