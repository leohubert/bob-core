import prompts from 'prompts';

import { Logger } from '@/src/Logger.js';

export type SelectOption = {
	title: string;
	value?: any;
	disabled?: boolean | undefined;
	selected?: boolean | undefined;
	description?: string | undefined;
};

export class CommandIO {
	private logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	/**
	 * Logger methods
	 */

	log(...args: any[]): void {
		this.logger.log(...args);
	}

	info(...args: any[]): void {
		this.logger.info(...args);
	}

	warn(...args: any[]): void {
		this.logger.warn(...args);
	}

	error(...args: any[]): void {
		this.logger.error(...args);
	}

	debug(...args: any[]): void {
		this.logger.debug(...args);
	}

	/**
	 * Prompt utils
	 */

	async askForConfirmation(message = 'Do you want to continue?', defaultValue?: boolean): Promise<boolean> {
		return (
			await prompts({
				type: 'confirm',
				name: 'value',
				message: message,
				initial: defaultValue ?? false,
			})
		).value;
	}

	async askForInput(
		message: string,
		defaultValue?: string | number,
		opts?: {
			type?: 'text' | 'password' | 'number';
			validate?: (value: string) => boolean | string;
			min?: number;
			max?: number;
		},
	): Promise<string | null> {
		return (
			(
				await prompts({
					type: 'text',
					name: 'value',
					message: message,
					initial: defaultValue,
					...opts,
				})
			)?.value ?? null
		);
	}

	async askForDate(
		message: string,
		defaultValue?: Date,
		opts?: {
			validate?: (value: Date) => boolean | string;
			mask?: string;
		},
	): Promise<Date | null> {
		return (
			(
				await prompts({
					type: 'date',
					name: 'value',
					message: message,
					initial: defaultValue,
					...opts,
				})
			)?.value ?? null
		);
	}

	async askForList(
		message: string,
		defaultValue?: string | number,
		opts?: {
			validate?: (value: string) => boolean | string;
			format?: (value: string) => string;
			separator?: string;
		},
	): Promise<string[] | null> {
		return (
			(
				await prompts({
					type: 'list',
					name: 'value',
					message: message,
					initial: defaultValue,
					...opts,
				})
			)?.value ?? null
		);
	}

	async askForToggle(
		message: string,
		defaultValue?: boolean,
		opts?: {
			active?: string;
			inactive?: string;
		},
	): Promise<boolean> {
		return (
			(
				await prompts({
					type: 'toggle',
					name: 'value',
					message: message,
					initial: defaultValue,
					...opts,
				})
			)?.value ?? null
		);
	}

	async askForSelect(
		message: string,
		options: Array<string | SelectOption>,
		opts?: {
			type?: 'select' | 'multiselect' | 'autocomplete' | 'autocompleteMultiselect';
			initial?: number;
			validate?: (value: string) => boolean;
			suggest?: (input: string, choices: SelectOption[]) => Promise<SelectOption[]>;
		},
	): Promise<string | null> {
		if (options.length === 0) {
			throw new Error('No options provided');
		}

		const choices: SelectOption[] = [];

		for (const option of options) {
			if (typeof option === 'string') {
				choices.push({ title: option, value: option });
			} else {
				choices.push(option);
			}
		}

		const result = await prompts({
			type: 'select',
			name: 'value',
			message: message,
			choices: choices,
			...opts,
		});

		return result?.value ?? null;
	}

	newLoader(text = '', chars = ['⠙', '⠘', '⠰', '⠴', '⠤', '⠦', '⠆', '⠃', '⠋', '⠉'], delay = 100) {
		let loaderText = text;
		let previousText: string | null = null;
		let x = 0;

		const interval = setInterval(function () {
			if (previousText) {
				process.stdout.write(new TextEncoder().encode('\r' + ' '.repeat(previousText.length + 5) + '\r'));
				previousText = null;
			}

			process.stdout.write(new TextEncoder().encode('\r' + chars[x++] + ' ' + loaderText));
			x = x % chars.length;
		}, delay);

		const stop = () => {
			clearInterval(interval);
			process.stdout.write(new TextEncoder().encode('\r' + ' '.repeat(loaderText.length + 5) + '\r'));
		};

		return {
			[Symbol.dispose]: stop,
			[Symbol.asyncDispose]: stop,
			updateText: (newText: string) => {
				previousText = loaderText;
				loaderText = newText;
			},
			stop,
		};
	}
}
