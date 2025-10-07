export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger interface defining standard logging methods and level management
 */
export interface LoggerContract {
	log(message: string, ...args: unknown[]): void;
	info(message: string, ...args: unknown[]): void;
	warn(message: string, ...args: unknown[]): void;
	error(message: string, ...args: unknown[]): void;
	debug(message: string, ...args: unknown[]): void;
	setLevel(level: LogLevel): void;
	getLevel(): LogLevel;
}
