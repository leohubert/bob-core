import {OptionsSchema, OptionsObject, ArgumentsSchema, ArgumentsObject} from "@/src/lib/types.js";
import {CommandParser} from "@/src/CommandParser.js";
import {CommandSignatureParser} from "@/src/CommandSignatureParser.js";
import {CommandOption} from "@/src/contracts/index.js";
import {HelpOption} from "@/src/options/index.js";
import {CommandIO} from "@/src/CommandIO.js";

type CommandHandlerOptions<Options extends OptionsSchema, Arguments extends ArgumentsSchema> = {
	options: OptionsObject<Options>
	arguments: ArgumentsObject<Arguments>
};
type CommandHandler<C, Options extends OptionsSchema, Arguments extends ArgumentsSchema> = (ctx: C, opts: CommandHandlerOptions<Options, Arguments>) => Promise<number | void> | number | void;

type CommandRunOption<Options extends OptionsSchema, Arguments extends ArgumentsSchema> = {
	args: string[];
} | {
	options: OptionsObject<Options>;
	arguments: ArgumentsObject<Arguments>;
}

export type CommandExample = {
	description: string;
	command: string;
}

export class Command<C = any, Options extends OptionsSchema = {}, Arguments extends ArgumentsSchema = {}> {

	private readonly _command?: string;

	signature?: string;
	description: string = '';

	protected helperDefinitions: { [key: string]: string } = {};
	protected commandsExamples: CommandExample[] = [];

	protected ctx!: C;
	protected io!: CommandIO;

	public handler?: CommandHandler<C, Options, Arguments>;

	protected parser!: CommandParser<Options, Arguments>;

	private tmp?: {
		options: Options;
		arguments: Arguments;
	}

	public get command(): string {
		if (this._command) {
			return this._command;
		}
		if (this.signature) {
			if (this.parser && this.parser instanceof CommandSignatureParser) {
				return this.parser.command;
			}
			return this.signature.split(' ')[0];
		}
		throw new Error('Command name is not defined');
	}

	protected defaultOptions(): CommandOption<Command>[] {
		return [new HelpOption()];
	}

	protected newCommandParser(opts: {
		io: CommandIO
		options: Options
		arguments: Arguments
	}): CommandParser<Options, Arguments> | CommandSignatureParser {
		return new CommandParser({
			io: opts.io,
			options: opts.options,
			arguments: opts.arguments
		});
	}

	protected newSignatureParser(opts: {
		io: CommandIO
		args: string[]
	}): CommandSignatureParser {
		return new CommandSignatureParser({
			io: opts.io,
			signature: this.signature!,
			helperDefinitions: this.helperDefinitions,
			defaultOptions: this.defaultOptions(),
		});
	}

	protected newCommandIO():  CommandIO {
		return new CommandIO();
	}

	constructor(command?: string, opts?: {
		description?: string
	}) {
		this._command = command;
		this.description = opts?.description ?? '';

		// If this is a subclass with signature property, set up handler to call handle() method
		if (this.constructor !== Command && 'signature' in this) {
			this.handler = async () => {
				return (this as any).handle();
			};
		}

		const defaultOptions = this.defaultOptions();

		if (defaultOptions.length > 0) {
			this.tmp = {
				options: {} as Options,
				arguments: {} as Arguments
			}

			for (const option of defaultOptions) {
				this.tmp.options[option.option as keyof Options] = option as any;
			}
		}
	}

	protected preHandle?(): Promise<void|number>;

	// For fluent API: .handle(function)
	handle(handler: CommandHandler<C, Options, Arguments>): Command<C, Options, Arguments>;
	// For signature-based commands: override this method
	handle(): Promise<number | void> | number | void;
	handle(arg?: any): any {
		if (typeof arg === 'function') {
			this.handler = arg;
			return this;
		} else if (arg === undefined) {
			// Signature-based command - subclass should override this
			throw new Error('Unimplemented handle() method. Please override handle() in your command class.');
		} else {
			throw new Error('Invalid argument passed to handle() method.');
		}
	}

	options<Opts extends OptionsSchema>(opts: Opts): Command<C, Options & Opts, Arguments> {
		this.tmp = {
			options: {
				...(this.tmp?.options ?? {} as Options),
				...opts
			},
			arguments: this.tmp?.arguments ?? {} as Arguments
		}
		return this as any;
	}

	arguments<Args extends ArgumentsSchema>(args: Args): Command<C, Options, Arguments & Args> {
		this.tmp = {
			options: this.tmp?.options ?? {} as Options,
			arguments: {
				...(this.tmp?.arguments ?? {} as Arguments),
				...args
			}
		}
		return this as any;
	}

	async run(ctx: C, opts: CommandRunOption<Options, Arguments>): Promise<number | void> {
		this.ctx = ctx;

		// Options-based command (new Command pattern)
		if (!this.handler) {
			throw new Error(`No handler defined for command ${this.command || '(unknown)'}`);
		}

		let handlerOptions: CommandHandlerOptions<Options, Arguments>

		this.io = this.newCommandIO();

		if (opts && 'args' in opts) {
			if (this.signature) {
				this.parser = this.newSignatureParser({
					io: this.io,
					args: opts.args
				});
			} else {
				this.parser = this.newCommandParser({
					io: this.io,
					options: this.tmp?.options ?? {} as Options,
					arguments: this.tmp?.arguments ?? {} as Arguments
				});
			}

			handlerOptions = await this.parser.init(opts.args);
		} else {
			handlerOptions = {
				options: opts.options,
				arguments: opts.arguments
			}
		}

		const preHandleResult = this.preHandle ? await this.preHandle() : null;
		if (preHandleResult && preHandleResult !== 0) {
			return preHandleResult;
		}


		const res = this.handler(ctx, handlerOptions);
		return Promise.resolve(res ?? 0);
	}

	// Helper methods from LegacyCommand

	protected setOption(name: string, value: any) {
		if (this.parser instanceof CommandSignatureParser) {
			this.parser.setOption(name, value);
		}
	}

	protected setArgument(name: string, value: any) {
		if (this.parser instanceof CommandSignatureParser) {
			this.parser.setArgument(name, value);
		}
	}

	protected option<T = string>(key: string): T | null
	protected option<T = string>(key: string, defaultValue: T): NoInfer<T>
	protected option<T = string>(key: string, defaultValue: T | null = null): NoInfer<T> | null {
		if (this.parser instanceof CommandSignatureParser) {
			return this.parser.option(key) as T ?? defaultValue;
		}
		return defaultValue;
	}

	protected optionBoolean(key: string, defaultValue: boolean = false): boolean  {
		if (this.parser instanceof CommandSignatureParser) {
			return this.parser.option(key) as boolean ?? defaultValue;
		}
		return defaultValue;
	}

	protected optionArray<T = string>(key: string, defaultValue: Array<T> = []): Array<NoInfer<T>> {
		if (this.parser instanceof CommandSignatureParser) {
			const values = this.parser.option(key) as Array<T>
			if (!Array.isArray(values)) {
				throw new Error(`Option ${key} is not an array`);
			}
			if (values.length) {
				return values;
			}
		}
		return defaultValue;
	}

	protected optionNumber(key: string): number | null
	protected optionNumber(key: string, defaultValue: number): number
	protected optionNumber(key: string, defaultValue: number | null = null): number | null {
		if (this.parser instanceof CommandSignatureParser) {
			const value = this.parser.option(key);
			if (!value) {
				return defaultValue;
			}
			if (typeof value === 'number') {
				return value;
			}
			return parseInt(value as string);
		}
		return defaultValue;
	}

	protected argument<T = string>(key: string): T | null
	protected argument<T = string>(key: string, defaultValue: T): NoInfer<T>
	protected argument<T = string>(key: string, defaultValue: T | null = null): NoInfer<T> | null {
		if (this.parser instanceof CommandSignatureParser) {
			return this.parser.argument(key) as T ?? defaultValue;
		}
		return defaultValue;
	}

	protected argumentArray<T = string>(key: string, defaultValue: Array<any> = []): Array<T> {
		if (this.parser instanceof CommandSignatureParser) {
			const values = this.parser.argument(key) as Array<T>
			if (!Array.isArray(values)) {
				throw new Error(`Argument ${key} is not an array`);
			}
			if (values?.length) {
				return values;
			}
		}
		return defaultValue;
	}

	protected argumentBoolean(key: string, defaultValue: boolean = false): boolean {
		if (this.parser instanceof CommandSignatureParser) {
			return this.parser.argument(key) as boolean ?? defaultValue;
		}
		return defaultValue;
	}

	protected argumentNumber(key: string, defaultValue: number | null = null): number | null {
		if (this.parser instanceof CommandSignatureParser) {
			const value = this.parser.argument(key);
			if (!value) {
				return defaultValue;
			}
			if (typeof value === 'number') {
				return value;
			}
			return parseInt(value as string);
		}
		return defaultValue;
	}

	// Prompt utils

	async askForConfirmation(...opts: Parameters<typeof this.io.askForConfirmation>): ReturnType<typeof this.io.askForConfirmation> {
		return this.io.askForConfirmation(...opts);
	}

	async askForInput(...opts: Parameters<typeof this.io.askForInput>): ReturnType<typeof this.io.askForInput> {
		return this.io.askForInput(...opts);
	}

	async askForSelect(...opts: Parameters<typeof this.io.askForSelect>): ReturnType<typeof this.io.askForSelect> {
		return this.io.askForSelect(...opts);
	}

	newLoader(...opts: Parameters<typeof this.io.newLoader>): ReturnType<typeof this.io.newLoader> {
		return this.io.newLoader(...opts);
	}
}