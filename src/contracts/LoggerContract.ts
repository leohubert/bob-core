export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'verbose';

/**
 * Logger interface defining standard logging methods and level management
 */
export interface LoggerContract {
	log(message: string, ...args: any[]): void;
	info(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
	error(message: string, ...args: any[]): void;
	debug(message: string, ...args: any[]): void;
	verbose(message: string, ...args: any[]): void;
	setLevel(level: LogLevel): void;
	getLevel(): LogLevel;
}