import { Command } from '@/src/Command.js';
import { Flags } from '@/src/Flags.js';
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
		config: Flags.file({ description: 'Config file path', required: true }),
		outDir: Flags.directory({ description: 'Output directory' }),
		endpoint: Flags.url({ description: 'API endpoint URL' }),
		since: dateFlag({ description: 'Start date' }),
	} satisfies FlagsSchema;

	static args = {
		format: Flags.enum({ options: ['json', 'csv', 'yaml'] as const, description: 'Output format' }),
	} satisfies FlagsSchema;

	async handle(_ctx: any, { flags, args }: Parsed<typeof ExtendedTypesCommand>) {
		this.io.log('Extended types demo:');
		this.io.log(`  level:    ${flags.level}`);
		this.io.log(`  port:     ${flags.port}`);
		this.io.log(`  config:   ${flags.config}`);
		this.io.log(`  outDir:   ${flags.outDir}`);
		this.io.log(`  endpoint: ${flags.endpoint ?? null}`);
		this.io.log(`  since:    ${flags.since?.toISOString() ?? null}`);
		this.io.log(`  format:   ${args.format}`);
	}
}
