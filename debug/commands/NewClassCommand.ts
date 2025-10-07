import { Command, CommandHandlerOptions } from '@/src/Command.js';
import { OptionsSchema } from '@/src/lib/types.js';

const CommandOptions = {
	test: 'string',
} satisfies OptionsSchema;
type CommandOptions = typeof CommandOptions;

const CommandArguments = {
	test: 'number',
} satisfies OptionsSchema;
type CommandArguments = typeof CommandArguments;

type Context = {
	userId: string;
};

export default class TestCommand extends Command<Context, CommandOptions, CommandArguments> {
	constructor() {
		super('test-class-new', {
			description: 'A test command that is not implemented yet',
			options: CommandOptions,
			arguments: CommandArguments,
		});
	}

	handle(ctx: Context, opts: CommandHandlerOptions<CommandOptions, CommandArguments>): void {
		const _test = opts.options.test;
		const _test2 = this.parser.option('test');

		console.log('Test command executed', {
			options: opts.options,
			arguments: opts.arguments,
		});
	}
}
