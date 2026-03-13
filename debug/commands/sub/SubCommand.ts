import { Command, CommandContext } from '../../command.js';

export default class SubCommand extends Command {
	static override signature = 'sub {name*}';
	static override description = 'sub command description';

	static override disablePrompting = true;

	protected handle(ctx: CommandContext, opts: any): Promise<void> {
		this.io.info('Sub command executed', ctx, opts);
		throw new Error('Method not implemented.');
	}
}
