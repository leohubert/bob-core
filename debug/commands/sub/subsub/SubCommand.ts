import { Command } from '../../../command.js';

export default class SubSubCommand extends Command {
	static override signature = 'sub:sub';
	static override description = 'sub:sub command description';

	static override group = 'test';

	protected handle(): Promise<void> {
		throw new Error('Method not implemented.');
	}
}
