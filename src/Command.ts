import { CommandIO, CommandIOOptions } from '@/src/CommandIO.js';
import { CommandParser } from '@/src/CommandParser.js';
import { Logger } from '@/src/Logger.js';
import { CommandOption } from '@/src/contracts/index.js';
import { ArgumentsObject, ArgumentsSchema, ContextDefinition, OptionsObject, OptionsSchema } from '@/src/lib/types.js';
import { HelpOption } from '@/src/options/index.js';

export type CommandHandlerOptions<Options extends OptionsSchema, Arguments extends ArgumentsSchema> = {
	options: OptionsObject<Options>;
	arguments: ArgumentsObject<Arguments>;
};
export type CommandHandler<C extends ContextDefinition, Options extends OptionsSchema, Arguments extends ArgumentsSchema> = (
	ctx: C,
	opts: CommandHandlerOptions<Options, Arguments>,
) => Promise<number | void> | number | void;

export type CommandRunOption<C, Options extends OptionsSchema, Arguments extends ArgumentsSchema> = {
	logger: Logger;
	ctx: C;
} & (
	| {
			args: string[];
	  }
	| {
			options: OptionsObject<Options>;
			arguments: ArgumentsObject<Arguments>;
	  }
);

export type CommandExample = {
	description: string;
	command: string;
};

export class Command<
	C extends ContextDefinition = ContextDefinition,
	Options extends OptionsSchema = OptionsSchema,
	Arguments extends ArgumentsSchema = ArgumentsSchema,
> {
	public readonly _command: string;
	public readonly description: string;
	public readonly group?: string;
	protected commandsExamples: CommandExample[] = [];

	get command(): string {
		return this._command;
	}

	protected ctx!: C;
	protected io!: CommandIO;
	protected parser!: CommandParser<Options, Arguments>;

	protected disablePromptingFlag = false;

	protected preHandle?(): Promise<void | number>;
	protected _preHandler?: CommandHandler<C, Options, Arguments>;

	protected handle?(ctx: C, opts: CommandHandlerOptions<Options, Arguments>): Promise<number | void> | number | void;
	protected _handler?: CommandHandler<C, Options, Arguments>;

	private tmp?: {
		options: Options;
		arguments: Arguments;
	};

	protected defaultOptions(): CommandOption<Command>[] {
		return [new HelpOption()];
	}

	protected newCommandParser(opts: { io: CommandIO; options: Options; arguments: Arguments }): CommandParser<Options, Arguments> {
		return new CommandParser({
			io: opts.io,
			options: opts.options,
			arguments: opts.arguments,
		});
	}

	protected newCommandIO(opts: CommandIOOptions): CommandIO {
		return new CommandIO(opts);
	}

	constructor(
		command: string,
		opts?: {
			description?: string;
			group?: string;
			options?: Options;
			arguments?: Arguments;
		},
	) {
		this._command = command;
		this.description = opts?.description ?? '';
		this.group = opts?.group;
		this.tmp = {
			options: opts?.options ?? ({} as Options),
			arguments: opts?.arguments ?? ({} as Arguments),
		};

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

	handler(handler: CommandHandler<C, Options, Arguments>) {
		this._handler = handler;
		return this;
	}

	options<Opts extends OptionsSchema>(opts: Opts): Command<C, Options & Opts, Arguments> {
		this.tmp = {
			options: {
				...(this.tmp?.options ?? ({} as Options)),
				...opts,
			},
			arguments: this.tmp?.arguments ?? ({} as Arguments),
		};

		return this as any;
	}

	arguments<Args extends ArgumentsSchema>(args: Args): Command<C, Options, Arguments & Args> {
		this.tmp = {
			options: this.tmp?.options ?? ({} as Options),
			arguments: {
				...(this.tmp?.arguments ?? ({} as Arguments)),
				...args,
			},
		};

		return this as any;
	}

	async run(opts: CommandRunOption<C, Options, Arguments>): Promise<number | void> {
		if (!this._handler && !this.handle) {
			throw new Error(`No handler defined for command ${this.command || '(unknown)'}`);
		}

		let handlerOptions: CommandHandlerOptions<Options, Arguments>;

		this.ctx = opts.ctx;
		this.io = this.newCommandIO({
			logger: opts.logger,
		});

		if (opts && 'args' in opts) {
			const options = this.tmp?.options ?? ({} as Options);
			for (const option of this.defaultOptions()) {
				if (!(option.option in options)) {
					(options as any)[option.option] = option as any;
				}
			}

			this.parser = this.newCommandParser({
				io: this.io,
				options: options,
				arguments: this.tmp?.arguments ?? ({} as Arguments),
			});
			handlerOptions = this.parser.init(opts.args);

			for (const option of this.defaultOptions()) {
				if (handlerOptions.options[option.option] === true) {
					const code = await option.handler.call(this as Command);
					if (code && code !== 0) {
						return code;
					}
				}
			}

			if (this.disablePromptingFlag) {
				this.parser.disablePrompting();
			}

			await this.parser.validate();
		} else {
			handlerOptions = {
				options: opts.options,
				arguments: opts.arguments,
			};
		}

		if (!this._preHandler && this.preHandle) {
			this._preHandler = this.preHandle.bind(this);
		}

		if (this._preHandler) {
			const preHandlerResult = await this._preHandler(opts.ctx, handlerOptions);
			if (preHandlerResult && preHandlerResult !== 0) {
				return preHandlerResult;
			}
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
