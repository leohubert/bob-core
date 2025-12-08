import path from 'node:path';

import { Cli } from '@/src/index.js';

import { Command, CommandContext } from './command.js';

class TestTestCommand extends Command {
	signature = 'scout:sync-index-settings';
	description = 'test test';

	protected async handle(): Promise<number | void> {
		const res = await this.ctx.bambooClient.getProjects();
		this.io.info(res);
		throw new Error('Method not implemented.');
	}
}

class TestOtherTestCommand extends Command {
	signature = 'scout:test-index-settings';
	description = 'other test';

	protected handle(): Promise<number | void> {
		throw new Error('Method not implemented.');
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

	await cli.withCommands(path.resolve(import.meta.dirname, './commands'), TestTestCommand, new TestOtherTestCommand());

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
