import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/src/Logger.js';
import { LogLevel } from '@/src/contracts/index.js';

describe('Logger', () => {
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;
	let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		consoleWarnSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	describe('Initialization', () => {
		it('should create logger with default info level', () => {
			const logger = new Logger();
			expect(logger.getLevel()).toBe('info');
		});

		it('should create logger with custom level', () => {
			const logger = new Logger({ level: 'debug' });
			expect(logger.getLevel()).toBe('debug');
		});

		it('should accept all valid log levels', () => {
			const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];

			levels.forEach(level => {
				const logger = new Logger({ level });
				expect(logger.getLevel()).toBe(level);
			});
		});
	});

	describe('Level management', () => {
		it('should update log level with setLevel', () => {
			const logger = new Logger({ level: 'info' });
			logger.setLevel('debug');
			expect(logger.getLevel()).toBe('debug');
		});

		it('should change logging behavior after level change', () => {
			const logger = new Logger({ level: 'warn' });

			logger.debug('test');
			expect(consoleLogSpy).not.toHaveBeenCalled();

			logger.setLevel('debug');
			logger.debug('test');
			expect(consoleLogSpy).toHaveBeenCalledWith('test');
		});
	});

	describe('log() method', () => {
		it('should always output regardless of log level', () => {
			const logger = new Logger({ level: 'warn' });
			logger.log('test message');
			expect(consoleLogSpy).toHaveBeenCalledWith('test message');
		});

		it('should accept multiple arguments', () => {
			const logger = new Logger();
			logger.log('message', { key: 'value' }, 123);
			expect(consoleLogSpy).toHaveBeenCalledWith('message', { key: 'value' }, 123);
		});
	});

	describe('Log level filtering - debug', () => {
		it('should show all messages at debug level', () => {
			const logger = new Logger({ level: 'debug' });

			logger.debug('debug msg');
			logger.info('info msg');
			logger.warn('warn msg');
			logger.error('error msg');

			expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug, info
			expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
			expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error
		});
	});

	describe('Log level filtering - info', () => {
		it('should show info and above at info level', () => {
			const logger = new Logger({ level: 'info' });

			logger.debug('debug msg');
			logger.info('info msg');
			logger.warn('warn msg');
			logger.error('error msg');

			expect(consoleLogSpy).toHaveBeenCalledTimes(1); // info
			expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
			expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error
		});
	});

	describe('Log level filtering - warn', () => {
		it('should show only warn and error at warn level', () => {
			const logger = new Logger({ level: 'warn' });

			logger.debug('debug msg');
			logger.info('info msg');
			logger.warn('warn msg');
			logger.error('error msg');

			expect(consoleLogSpy).not.toHaveBeenCalled();
			expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe('Log level filtering - error', () => {
		it('should show only error at error level', () => {
			const logger = new Logger({ level: 'error' });

			logger.debug('debug msg');
			logger.info('info msg');
			logger.warn('warn msg');
			logger.error('error msg');

			expect(consoleLogSpy).not.toHaveBeenCalled();
			expect(consoleWarnSpy).not.toHaveBeenCalled();
			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe('Output methods', () => {
		it('should use console.log for debug messages', () => {
			const logger = new Logger({ level: 'debug' });
			logger.debug('debug message');
			expect(consoleLogSpy).toHaveBeenCalledWith('debug message');
		});

		it('should use console.log for info messages', () => {
			const logger = new Logger({ level: 'info' });
			logger.info('info message');
			expect(consoleLogSpy).toHaveBeenCalledWith('info message');
		});

		it('should use console.warn for warn messages', () => {
			const logger = new Logger({ level: 'warn' });
			logger.warn('warn message');
			expect(consoleWarnSpy).toHaveBeenCalledWith('warn message');
		});

		it('should use console.error for error messages', () => {
			const logger = new Logger({ level: 'error' });
			logger.error('error message');
			expect(consoleErrorSpy).toHaveBeenCalledWith('error message');
		});
	});

	describe('Multiple arguments', () => {
		it('should pass all arguments to console methods', () => {
			const logger = new Logger({ level: 'debug' });

			logger.debug('msg1', 'msg2', 123, { key: 'value' });
			expect(consoleLogSpy).toHaveBeenCalledWith('msg1', 'msg2', 123, {
				key: 'value',
			});

			logger.info('info', ['array'], null);
			expect(consoleLogSpy).toHaveBeenCalledWith('info', ['array'], null);
		});
	});
});
