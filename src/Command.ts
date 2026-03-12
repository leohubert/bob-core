import { CommandIO, CommandIOOptions } from '@/src/CommandIO.js';
import { CommandParser } from '@/src/CommandParser.js';
import { Logger } from '@/src/Logger.js';
import { ArgumentsSchema, ContextDefinition, FlagsSchema, Parsed } from '@/src/lib/types.js';
import { HelpCommandFlag } from '@/src/options/index.js';

export type CommandExample = {
	description: string;
	command: string;
};

export type CommandRunOption<C = ContextDefinition> = {
	logger: Logger;
	ctx: C;
} & (
	| {
			args: string[];
	  }
	| {
			args: Record<string, any>;
			flags: Record<string, any>;
	  }
);

export abstract class Command<C extends ContextDefinition = ContextDefinition> {
	$type = 'BobCommand' as const;

	// Static metadata — override in subclasses
	static command: string = '';
	static description: string = '';
	static group?: string;
	static args: ArgumentsSchema = {};
	static flags: FlagsSchema = {};
	static examples: CommandExample[] = [];
	static hidden: boolean = false;

	// Static configuration options
	static disableDefaultOptions: boolean = false;
	static disablePrompting: boolean = false;
	static allowUnknownOptions: boolean = false;
	static strictMode: boolean = false;

	protected ctx!: C;
	protected io!: CommandIO;
	protected parser!: CommandParser<FlagsSchema, FlagsSchema>;

	protected preHandle?(): Promise<void | number>;
	protected abstract handle(ctx: C, parsed: Parsed<any>): Promise<number | void> | number | void;

	static baseFlags: FlagsSchema = {
		help: HelpCommandFlag,
	};

	protected newCommandParser(opts: {
		flags: FlagsSchema;
		args: ArgumentsSchema;
		ctx: ContextDefinition;
		io: CommandIO;
	}): CommandParser<FlagsSchema, FlagsSchema> {
		return new CommandParser({
			io: opts.io,
			ctx: opts.ctx,
			flags: opts.flags,
			args: opts.args,
		});
	}

	protected newCommandIO(opts: CommandIOOptions): CommandIO {
		return new CommandIO(opts);
	}

	async run(runOpts: CommandRunOption<C>): Promise<number | void> {
		const ctor = this.constructor as typeof Command;

		this.ctx = runOpts.ctx;
		this.io = this.newCommandIO({ logger: runOpts.logger });

		let handlerInput: { flags: Record<string, any>; args: Record<string, any> };

		if (!('flags' in runOpts)) {
			this.parser = this.newCommandParser({
				ctx: this.ctx,
				io: this.io,
				flags: ctor.disableDefaultOptions ? ctor.flags : { ...ctor.baseFlags, ...ctor.flags },
				args: ctor.args,
			});

			if (ctor.allowUnknownOptions) {
				this.parser.allowUnknownFlags();
			}
			if (ctor.strictMode) {
				this.parser.strictMode();
			}

			const parsed = await this.parser.init(runOpts.args);

			for (const flag in parsed.flags) {
				const value: any = parsed.flags[flag];
				const definition = ctor.flags[flag] || ctor.baseFlags[flag];

				if (definition && definition.handler) {
					const res = definition.handler(value, runOpts.ctx, ctor);
					if (res.shouldStop) {
						return -1;
					}
				}
			}

			if (ctor.disablePrompting) {
				this.parser.disablePrompting();
			}

			await this.parser.validate();

			handlerInput = {
				flags: parsed.flags,
				args: parsed.args,
			};
		} else {
			handlerInput = {
				flags: runOpts.flags,
				args: runOpts.args,
			};
		}

		if (this.preHandle) {
			const preHandleResult = await this.preHandle();
			if (preHandleResult && preHandleResult !== 0) {
				return preHandleResult;
			}
		}

		const res = await this.handle(this.ctx, handlerInput);
		return res ?? 0;
	}
}
