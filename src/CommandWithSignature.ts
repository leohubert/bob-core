import { Command, CommandHandlerOptions } from '@/src/Command.js';
import { CommandIO } from '@/src/CommandIO.js';
import { CommandSignatureParser } from '@/src/CommandSignatureParser.js';
import { ContextDefinition, OptionsSchema } from '@/src/lib/types.js';

export abstract class CommandWithSignature<
	C extends ContextDefinition = ContextDefinition,
	Opts extends OptionsSchema = OptionsSchema,
	Args extends OptionsSchema = OptionsSchema,
> extends Command<C, Opts, Args> {
	abstract signature: string;
	abstract description: string;

	protected helperDefinitions: { [key: string]: string } = {};
	declare protected parser: CommandSignatureParser<Opts, Args>;

	get command(): string {
		if (this.parser) {
			return this.parser.command;
		}
		return this.signature.split(' ')[0];
	}

	protected newCommandParser(opts: { io: CommandIO; options: Opts; arguments: Args }): CommandSignatureParser<Opts, Args> {
		return new CommandSignatureParser({
			io: opts.io,
			signature: this.signature,
			helperDefinitions: this.helperDefinitions,
			defaultOptions: this.defaultOptions(),
		});
	}
	constructor() {
		super('');
	}

	protected abstract handle(ctx: C, opts: CommandHandlerOptions<Opts, Args>): Promise<number | void>;

	protected option<T = string>(key: string): T | null;
	protected option<T = string>(key: string, defaultValue: T): NoInfer<T>;
	protected option<T = string>(key: string, defaultValue: T | null = null): NoInfer<T> | null {
		return this.parser.option(key, defaultValue as any) as any;
	}

	protected argument<T = string>(key: string): T | null;
	protected argument<T = string>(key: string, defaultValue: T): NoInfer<T>;
	protected argument<T = string>(key: string, defaultValue: T | null = null): NoInfer<T> | null {
		return this.parser.argument(key, defaultValue as any) as any;
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
