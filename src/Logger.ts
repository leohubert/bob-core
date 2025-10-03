export type LogLevel = 'debug' | 'verbose' | 'info' | 'warn' | 'error' | 'silent';

export type LoggerOptions = {
	level?: LogLevel;
}

export class Logger {
	private level: LogLevel;

	constructor(opts: LoggerOptions = {}) {
		this.level = opts.level ?? 'info';
	}

	private shouldLog(level: LogLevel): boolean {
		const levels: LogLevel[] = ['debug', 'verbose', 'info', 'warn', 'error', 'silent'];
		const currentLevelIndex = levels.indexOf(this.level);
		const messageLevelIndex = levels.indexOf(level);
		return messageLevelIndex >= currentLevelIndex;
	}

	setLevel(level: LogLevel): void {
		this.level = level;
	}

	getLevel(): LogLevel {
		return this.level;
	}

	log(...args: any[]): void {
		console.log(...args);
	}

	info(...args: any[]): void {
		if (this.shouldLog('info')) {
			console.log(...args);
		}
	}

	warn(...args: any[]): void {
		if (this.shouldLog('warn')) {
			console.warn(...args);
		}
	}

	error(...args: any[]): void {
		if (this.shouldLog('error')) {
			console.error(...args);
		}
	}

	debug(...args: any[]): void {
		if (this.shouldLog('debug')) {
			console.log(...args);
		}
	}

	verbose(...args: any[]): void {
		if (this.shouldLog('verbose')) {
			console.log(...args);
		}
	}
}
