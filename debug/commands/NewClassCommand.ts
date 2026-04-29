import { Command } from '@/src/Command.js';
import { Flags } from '@/src/flags/index.js';
import { FlagsSchema, Parsed } from '@/src/lib/types.js';

type Context = {
	userId: string;
};

export default class TestCommand extends Command<Context> {
	static command = 'test-class-new';
	static description = 'A test command that is not implemented yet';

	static flags = { test: Flags.string() } satisfies FlagsSchema;
	static args = { test: Flags.number() } satisfies FlagsSchema;

	async handle(ctx: Context, { flags, args }: Parsed<typeof TestCommand>) {
		const _test = flags.test;
		const _test2 = this.parser.flag('test');

		console.log('Test command executed', { flags, args });
	}
}
