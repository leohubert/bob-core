import { Command } from '@/src/Command.js';
import { Flags } from '@/src/flags/index.js';
import { FlagsSchema, Parsed } from '@/src/lib/types.js';

const dateFlag = Flags.custom<Date>({
	parse: v => {
		const d = new Date(v);
		if (isNaN(d.getTime())) throw new Error('Invalid date');
		return d;
	},
});

export default class ExtendedTypesCommand extends Command {
	static command = 'extended-types';
	static description = 'Showcase new extended flag types (enum, file, url, custom)';

	static flags = {
		level: Flags.enum({ options: ['debug', 'info', 'warn', 'error'] as const, description: 'Log level' }),
		port: Flags.number({ min: 1, max: 65535, default: 3000, description: 'Server port' }),
		config: Flags.file({ description: 'Config file path', required: true, exists: true }),
		outDir: Flags.directory({ description: 'Output directory', required: true, exists: true }),
		endpoint: Flags.url({ description: 'API endpoint URL' }),
		since: dateFlag({ description: 'Start date' }),
	} satisfies FlagsSchema;

	static args = {
		format: Flags.enum({ options: ['json', 'csv', 'yaml'] as const, description: 'Output format' }),
	} satisfies FlagsSchema;

	async handle(_ctx: any, { flags, args }: Parsed<typeof ExtendedTypesCommand>) {
		this.logger.log('Extended types demo:');
		this.logger.log(`  level:    ${flags.level}`);
		this.logger.log(`  port:     ${flags.port}`);
		this.logger.log(`  config:   ${flags.config}`);
		this.logger.log(`  outDir:   ${flags.outDir}`);
		this.logger.log(`  endpoint: ${flags.endpoint ?? null}`);
		this.logger.log(`  since:    ${flags.since?.toISOString() ?? null}`);
		this.logger.log(`  format:   ${args.format}`);
	}
}
