import { Command } from '../../command.js';

export default class TestSubCommand extends Command {
	static override signature = 'test:sub';
	static override description = 'sub command description';

	protected handle(): Promise<void> {
		throw new Error('Method not implemented.');
	}
}
