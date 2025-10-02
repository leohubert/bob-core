import {OptionsSchema, OptionsObject, ArgumentsSchema, ArgumentsObject} from "@/src/lib/types.js";
import {CommandParser} from "@/src/CommandParser.js";

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

export class Command<C = any, Options extends OptionsSchema = {}, Arguments extends ArgumentsSchema = {}> {

	readonly command: string;

	protected ctx!: C;
	public handler?: CommandHandler<C, Options, Arguments>;

	private tmp?: {
		options: Options;
		arguments: Arguments;
	}

	constructor(command: string) {
		this.command = command;
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

	handle(handler: CommandHandler<C, Options, Arguments>): Command<C, Options, Arguments> {
		this.handler = handler;
		return this
	}

	run(ctx: C, opts: CommandRunOption<Options, Arguments>): Promise<number | void> {
		if (!this.handler) {
			return Promise.reject(new Error('No handler defined for command ' + this.command));
		}

		let handlerOptions: CommandHandlerOptions<Options, Arguments>

		if ('args' in opts ) {
			const commandParser = new CommandParser<Options, Arguments>({
				options: this.tmp?.options ?? {} as Options,
				arguments: this.tmp?.arguments ?? {} as Arguments
			});
			handlerOptions = commandParser.init(opts.args);
		} else {
			handlerOptions = {
				options: opts.options,
				arguments: opts.arguments
			}
		}

		const res = this.handler(ctx, handlerOptions);
		return Promise.resolve(res ?? 0);
	}
}