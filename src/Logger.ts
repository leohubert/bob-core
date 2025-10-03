import {LoggerContract, LogLevel} from "@/src/contracts/index.js";


export type LoggerOptions = {
	level?: LogLevel;
}

export class Logger implements LoggerContract {
	private level: LogLevel;

	constructor(opts: LoggerOptions = {}) {
		this.level = opts.level ?? 'info';
	}

	private shouldLog(level: LogLevel): boolean {
		const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
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
}
