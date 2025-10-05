import {OptionsSchema, OptionsObject, ArgumentsSchema, ArgumentsObject} from "@/src/lib/types.js";
import {CommandParser} from "@/src/CommandParser.js";
import {CommandSignatureParser} from "@/src/CommandSignatureParser.js";
import {CommandOption} from "@/src/contracts/index.js";
import {HelpOption} from "@/src/options/index.js";
import {CommandIO} from "@/src/CommandIO.js";
import {Logger} from "@/src/Logger.js";

export type CommandHandlerOptions<Options extends OptionsSchema, Arguments extends ArgumentsSchema> = {
	options: OptionsObject<Options>
	arguments: ArgumentsObject<Arguments>
};
export type CommandHandler<C, Options extends OptionsSchema, Arguments extends ArgumentsSchema> = (ctx: C, opts: CommandHandlerOptions<Options, Arguments>) => Promise<number | void> | number | void;

type BaseCommandRunOption<C> = {
	logger: Logger
	ctx: C
}

export type CommandRunArgsOption<C> = {
	args: string[];
} & BaseCommandRunOption<C>;
export type CommandRunParsedOption<C, Options extends OptionsSchema, Arguments extends ArgumentsSchema> = {
	options: OptionsObject<Options>;
	arguments: ArgumentsObject<Arguments>;
} & BaseCommandRunOption<C>;

export type CommandRunOption<C, Options extends OptionsSchema, Arguments extends ArgumentsSchema> = CommandRunArgsOption<C> | CommandRunParsedOption<C, Options, Arguments>;

export type CommandExample = {
	description: string;
	command: string;
}

export class Command<C = any, Options extends OptionsSchema = {}, Arguments extends ArgumentsSchema = {}> {

	public readonly _command: string;
	public readonly description: string = '';
	public readonly group?: string;
	protected commandsExamples: CommandExample[] = [];

	get command(): string {
		return this._command;
	}

	protected ctx!: C;
	protected io!: CommandIO;
	protected logger!: Logger;
	protected parser!: CommandParser<Options, Arguments>;

	protected disablePromptingFlag = false;

	protected preHandle?(): Promise<void|number>;
	protected _preHandler?: CommandHandler<C, Options, Arguments>;

	protected handle?(ctx: C, opts: CommandHandlerOptions<Options, Arguments>): Promise<number | void> | number | void;
	protected _handler?: CommandHandler<C, Options, Arguments>;

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
	}): CommandParser<Options, Arguments> {
		return new CommandParser({
			io: opts.io,
			options: opts.options,
			arguments: opts.arguments
		});
	}

	protected newCommandIO(opts: {
		logger: Logger;
	}):  CommandIO {
		return new CommandIO(opts.logger);
	}

	constructor(command: string, opts?: {
		description?: string,
		group?: string,
		options?: Options,
		arguments?: Arguments
	}) {
		this._command = command;
		this.description = opts?.description ?? '';
		this.group = opts?.group;
		this.tmp = {
			options: opts?.options ?? {} as Options,
			arguments: opts?.arguments ?? {} as Arguments
		}

		const defaultOptions = this.defaultOptions();

		if (defaultOptions.length > 0) {

			for (const option of defaultOptions) {
				this.tmp.options[option.option as keyof Options] = option as any;
			}
		}
	}

	disablePrompting() {
		this.disablePromptingFlag = true;
		return this;
	}

	preHandler(handler: CommandHandler<C, Options, Arguments>) {
		this._preHandler = handler;
		return this;
	}

	handler(handler: CommandHandler<C, Options, Arguments>){
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

	async run(opts: CommandRunOption<C, Options, Arguments>): Promise<number | void> {
		if (!this._handler && !this.handle) {
			throw new Error(`No handler defined for command ${this.command || '(unknown)'}`);
		}

		let handlerOptions: CommandHandlerOptions<Options, Arguments>

		this.ctx = opts.ctx;
		this.logger = opts.logger;
		this.io = this.newCommandIO({
			logger: opts.logger
		});

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
			})
			handlerOptions = this.parser.init(opts.args);

			for (const option of this.defaultOptions()) {
				if (handlerOptions.options[option.option] === true) {
					const code = await option.handler.call(this);
					if (code && code !== 0) {
						return code;
					}
				}
			}

			if (this.disablePromptingFlag) {
				this.parser.disablePrompting();
			}

			await this.parser.validate()
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


		if (!this._handler && this.handle) {
			this._handler = this.handle.bind(this);
		} else if (!this._handler) {
			throw new Error(`No handler defined for command ${this.command || '(unknown)'}`);
		}

		const res = await this._handler(opts.ctx, handlerOptions);
		return res ?? 0;
	}
}