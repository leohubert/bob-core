import { Command } from '@/src/Command.js';
import { Args } from '@/src/args/index.js';
import { Flags } from '@/src/flags/index.js';
import { ArgsSchema, FlagsSchema, Parsed } from '@/src/lib/types.js';

type Toto = {
	body: string;
};

export default class NewTestCommand extends Command {
	static command = 'new-test-command';
	static description = 'A new test command that is not implemented yet';
	static group = 'test';

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
			required: true,
			description: 'Age argument',
			default: () => {
				return new Promise<string>(resolve => {
					setTimeout(() => {
						resolve('dd');
					}, 1000);
				});
			},
		}),
		tags: Args.number({
			required: true,
			multiple: true,
			description: 'Tags',
		}),
	} satisfies ArgsSchema;

	static flags = {
		force: Flags.boolean(),
		test: Flags.string({
			description: 'A test option',
			required: true,
		}),
		anotherTest: Flags.boolean({
			alias: 'f',
		}),
		custom: Flags.custom<Toto>({
			description: 'Custom test option',
			help: 'Custom test help option',
		})(),
		multiple: Flags.number({
			multiple: true,
		}),
		async: Flags.number({
			multiple: true,
			default: () => {
				return new Promise<number[]>(resolve => {
					setTimeout(() => {
						resolve([1, 2, 3]);
					}, 1000);
				});
			},
		}),
	} satisfies FlagsSchema;

	async handle(ctx: any, { flags, args }: Parsed<typeof NewTestCommand>) {
		const _test = flags.anotherTest || flags.force;
		const _required = args.tags;
		const _anotherRequired = flags.anotherTest;
		const _custom = flags.custom;
		console.log('test command', { flags, args });
	}
}
