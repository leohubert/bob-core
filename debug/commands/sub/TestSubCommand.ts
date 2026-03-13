import { Command } from '../../command.js';

export default class TestSubCommand extends Command {
	override signature = 'test:sub';
	description = 'sub command description';

	protected handle(): Promise<void> {
		throw new Error('Method not implemented.');
	}
}
