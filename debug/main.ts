import path from 'node:path';

import { Cli } from '@/src/index.js';

import { Command, CommandContext } from './command.js';

class TestCommand extends Command {
	static command = 'test';
	static aliases = ['t', 'bb'];
	static description = 'This is a test command';

	protected async handle(): Promise<number | void> {
		const res = await this.ctx.bambooClient.getProjects();
		this.logger.info(res);
		throw new Error('Method not implemented.');
	}
}

class TestInstanceCommand extends Command {
	static command = 'test:instance';
	static description = 'This is a test command instance';

	protected handle(): Promise<number | void> {
		throw new Error('Method instnace not implemented.');
	}
}

async function main() {
	const ctx: CommandContext = {
		logger: {
			verbose: false,
		},
		bambooClient: {
			getProjects: async () => {
				return [
					{
						name: 'Project 1',
					},
					{
						name: 'Project 2',
					},
				];
			},
		},
	};

	const cli = new Cli<CommandContext>({
		ctx,
		name: 'Test CLI',
		version: '0.0.1',
	});

	await cli.withCommands(path.resolve(import.meta.dirname, './commands'), TestCommand, new TestInstanceCommand());

	const command = process.argv.at(2);

	return await cli.runCommand(command, ...process.argv.slice(3));
}

main()
	.then(process.exit)
	.catch(err => {
		// Using console.error here is fine as this is the top-level error handler
		console.error(err);
		process.exit(1);
	});
