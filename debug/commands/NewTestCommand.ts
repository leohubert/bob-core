import { Command } from '@/src/Command.js';
import { Args, Flags } from '@/src/Flags.js';
import { ArgumentsSchema, FlagsSchema, Parsed } from '@/src/lib/types.js';

export default class NewTestCommand extends Command {
	static command = 'new-test-command';
	static description = 'A new test command that is not implemented yet';
	static group = 'testing';

	static args = {
		name: Args.string({
			required: true,
			description: 'Name argument',
		}),
		age: Args.number({
			required: true,
			description: 'Age argument',
			max: 55,
		}),
		tests: Args.string({
			secret: true,
			required: true,
			description: 'Age argument',
		}),
		tags: Args.number({
			required: true,
			multiple: true,
			description: 'Tags',
		}),
	} satisfies ArgumentsSchema;

	static flags = {
		force: Flags.boolean(),
		test: Flags.string({
			description: 'A test option',
			required: true,
		}),
		anotherTest: Flags.boolean({
			alias: 'f',
		}),
	} satisfies FlagsSchema;

	async handle(ctx: any, { flags, args }: Parsed<typeof NewTestCommand>) {
		const _test = flags.anotherTest || flags.force;
		const toto = args.tags;
		console.log('test command', { flags, args });
	}
}
