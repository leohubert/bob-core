import {OptionsSchema, OptionsObject, ArgumentsSchema, ArgumentsObject} from "@/src/lib/types.js";
import {CommandParser} from "@/src/CommandParser.js";
import {CommandSignatureParser} from "@/src/CommandSignatureParser.js";
import {CommandOption} from "@/src/contracts/index.js";
import {HelpOption} from "@/src/options/index.js";
import {CommandIO} from "@/src/CommandIO.js";

export type CommandHandlerOptions<Options extends OptionsSchema, Arguments extends ArgumentsSchema> = {
	options: OptionsObject<Options>
	arguments: ArgumentsObject<Arguments>
};
export type CommandHandler<C, Options extends OptionsSchema, Arguments extends ArgumentsSchema> = (ctx: C, opts: CommandHandlerOptions<Options, Arguments>) => Promise<number | void> | number | void;

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

	public readonly _command: string;
	public readonly description: string = '';
	protected commandsExamples: CommandExample[] = [];

	get command(): string {
		return this._command;
	}

	protected ctx!: C;
	protected io!: CommandIO;
	protected logger?: any;

	protected _handler?: CommandHandler<C, Options, Arguments>;

	protected parser!: CommandParser<Options, Arguments>;

	private tmp?: {
		options: Options;
		arguments: Arguments;
	}

	protected defaultOptions(): CommandOption<Command<any, any, any>>[] {
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

	protected newCommandIO():  CommandIO {
		return new CommandIO(this.logger);
	}

	constructor(command: string, opts?: {
		description?: string
	}) {
		this._command = command;
		this.description = opts?.description ?? '';

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
	protected handle?(ctx: C, opts: CommandHandlerOptions<Options, Arguments>): Promise<number | void>;

	handler(handler: CommandHandler<C, Options, Arguments>): Command<C, Options, Arguments> {
		this._handler = handler;
		return this;
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

	async run(ctx: C, opts: CommandRunOption<Options, Arguments>, logger?: any): Promise<number | void> {
		this.ctx = ctx;
		this.logger = logger;

		if (!this._handler && !this.handle) {
			throw new Error(`No handler defined for command ${this.command || '(unknown)'}`);
		}

		let handlerOptions: CommandHandlerOptions<Options, Arguments>

		this.io = this.newCommandIO();

		if (opts && 'args' in opts) {
			const options = this.tmp?.options ?? {} as Options;
			for (const option of this.defaultOptions()) {
				if (!(option.option in options)) {
					(options as any)[option.option] = option as any;
				}
			}

			this.parser = this.newCommandParser({
				io: this.io,
				options: options,
				arguments: this.tmp?.arguments ?? {} as Arguments
			});
			handlerOptions = this.parser.init(opts.args);
		} else {
			handlerOptions = {
				options: opts.options,
				arguments: opts.arguments
			}
		}

		for (const option of this.defaultOptions()) {
			if (this.parser.option(option.option)) {
				const code = await option.handler.call(this);
				if (code && code !== 0) {
					return code;
				}
			}
		}

		await this.parser.validate()

		const preHandleResult = this.preHandle ? await this.preHandle() : null;
		if (preHandleResult && preHandleResult !== 0) {
			return preHandleResult;
		}


		if (!this._handler && this.handle) {
			this._handler = this.handle.bind(this);
		} else if (!this._handler) {
			throw new Error(`No handler defined for command ${this.command || '(unknown)'}`);
		}

		const res = this._handler(ctx, handlerOptions);
		return Promise.resolve(res ?? 0);
	}
}