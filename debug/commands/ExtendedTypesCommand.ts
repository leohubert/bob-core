import { Command } from '@/src/Command.js';
import { Args } from '@/src/args/index.js';
import { Flags } from '@/src/flags/index.js';
import { ArgsSchema, FlagsSchema, Parsed } from '@/src/lib/types.js';

const dateFlag = Flags.custom<Date>({
	parse: (v: string) => {
		const d = new Date(v);
		if (isNaN(d.getTime())) throw new Error('Invalid date');
		return d;
	},
});

export default class ExtendedTypesCommand extends Command {
	static command = 'extended-types';
	static description = 'Showcase new extended flag types (option, file, url, custom)';

	static flags = {
		level: Flags.option({ options: ['debug', 'info', 'warn', 'error'] as const, description: 'Log level' }),
		port: Flags.number({ min: 1, max: 65535, default: 3000, description: 'Server port' }),
		config: Flags.file({ description: 'Config file path', required: true, exists: true }),
		outDir: Flags.directory({ description: 'Output directory', required: true, exists: true }),
		endpoint: Flags.url({ description: 'API endpoint URL' }),
		test: Flags.string({
			description: 'A simple string flag',
			default: async () => {
				return 'oui';
			},
		}),
		since: dateFlag({ description: 'Start date', required: true }),
	} satisfies FlagsSchema;

	static args = {
		format: Args.option({ options: ['json', 'csv', 'yaml'] as const, description: 'Output format', default: 'json' }),
	} satisfies ArgsSchema;

	async handle(_ctx: any, { flags, args }: Parsed<typeof ExtendedTypesCommand>) {
		const toto = await this.ux.askForSearch('Select an option', _term => {
			return [
				{
					name: 'Cat',
					value: 'cat',
				},
				{
					name: 'Dog',
					value: 'dog',
				},
			];
		});

		this.logger.log('Extended types demo:');
		this.logger.log(`  level:    ${flags.level}`);
		this.logger.log(`  port:     ${flags.port}`);
		this.logger.log(`  config:   ${flags.config}`);
		this.logger.log(`  outDir:   ${flags.outDir}`);
		this.logger.log(`  endpoint: ${flags.endpoint}`);
		this.logger.log(`  since:    ${flags.since.toISOString()}`);
		this.logger.log(`  format:   ${args.format}`);
		this.logger.log(`  toto:   ${toto}`);
	}
}
