import { CommandParser } from '@/src/CommandParser.js';
import { HelpCommandFlag } from '@/src/HelpFlag.js';
import { Logger } from '@/src/Logger.js';
import { ArgsSchema, ContextDefinition, FlagsSchema, ParameterOpts, Parsed } from '@/src/lib/types.js';
import { UX } from '@/src/ux/index.js';

export type CommandRunExample = {
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
	static $type = 'BobCommand' as const;

	// Static metadata — override in subclasses
	static command: string = '';
	static description: string = '';
	static group?: string;
	static args: ArgsSchema = {};
	static flags: FlagsSchema = {};
	static examples: CommandRunExample[] = [];
	static hidden: boolean = false;
	static aliases: string[] = [];

	// Static configuration options
	static disableDefaultOptions: boolean = false;
	static disablePrompting: boolean = false;
	static allowUnknownFlags: boolean = false;
	static strictMode: boolean = false;

	protected ctx!: C;
	protected logger!: Logger;
	protected ux!: UX;
	protected parser!: CommandParser<FlagsSchema, ArgsSchema>;

	protected preHandle?(): Promise<void | number>;
	protected abstract handle(ctx: C, parsed: Parsed<any>): Promise<number | void> | number | void;

	static baseFlags: FlagsSchema = {
		help: HelpCommandFlag,
	};

	protected newCommandParser(opts: {
		flags: FlagsSchema;
		args: ArgsSchema;
		ctx: ContextDefinition;
		ux: UX;
		cmd: typeof Command;
	}): CommandParser<FlagsSchema, ArgsSchema> {
		return new CommandParser({
			ux: opts.ux,
			ctx: opts.ctx,
			flags: opts.flags,
			args: opts.args,
			cmd: opts.cmd,
		});
	}

	protected newUX(): UX {
		return new UX();
	}

	async run(runOpts: CommandRunOption<C>): Promise<number | void> {
		const ctor = this.constructor as typeof Command;

		this.ctx = runOpts.ctx;
		this.logger = runOpts.logger;
		this.ux = this.newUX();

		let handlerInput: { flags: Record<string, any>; args: Record<string, any> };

		if (!('flags' in runOpts)) {
			this.parser = this.newCommandParser({
				ctx: this.ctx,
				ux: this.ux,
				flags: ctor.disableDefaultOptions ? ctor.flags : { ...ctor.baseFlags, ...ctor.flags },
				args: ctor.args,
				cmd: ctor,
			});

			if (ctor.allowUnknownFlags) {
				this.parser.allowUnknownFlags();
			}
			if (ctor.strictMode) {
				this.parser.strictMode();
			}

			if (ctor.disablePrompting) {
				this.parser.disablePrompting();
			}

			const parsed = await this.parser.init(runOpts.args);

			for (const flag in parsed.flags) {
				const value: any = parsed.flags[flag];
				const definition = ctor.flags[flag] || ctor.baseFlags[flag];

				if (definition && definition.handler) {
					const flagOpts: ParameterOpts = { name: flag, ux: this.ux, ctx: runOpts.ctx, definition, cmd: ctor };
					const res = definition.handler(value as never, flagOpts);
					if (res && res.shouldStop) {
						return -1;
					}
				}
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
