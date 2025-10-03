import {Command, CommandExample, CommandHandlerOptions} from "@/src/Command.js";
import {CommandIO} from "@/src/CommandIO.js";
import {CommandSignatureParser} from "@/src/CommandSignatureParser.js";
import {OptionsSchema} from "@/src/lib/types.js";

export abstract class CommandWithSignature<C = any, Opts extends OptionsSchema = {}, Args extends OptionsSchema = {}> extends Command<C, Opts, Args> {

	abstract signature: string;
	abstract description: string;

	protected helperDefinitions: { [key: string]: string } = {};

	get command(): string {
		if (this.parser) {
			return this.parser.command;
		}
		return this.signature.split(' ')[0];
	}

	declare parser: CommandSignatureParser<Opts, Args>;

	protected newCommandParser(opts: {
		io: CommandIO;
		options: Opts;
		arguments: Args;
	}): CommandSignatureParser {
		return new CommandSignatureParser({
			io: opts.io,
			signature: this.signature,
			helperDefinitions: this.helperDefinitions,
			defaultOptions: this.defaultOptions()
		});
	}
	constructor() {
		super('')
	}

	protected abstract handle(ctx: C, opts: CommandHandlerOptions<Opts, Args>): Promise<number | void>

	// Helper methods from LegacyCommand

	protected setOption(name: string, value: any) {
		this.parser.setOption(name, value);
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