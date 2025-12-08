import { Command, CommandContext } from '../../command.js';

export default class SubCommand extends Command {
	signature = 'sub {name*}';
	description = 'sub command description';

	disablePromptingFlag = true;

	protected handle(ctx: CommandContext, opts: any): Promise<void> {
		this.io.info('Sub command executed', ctx, opts);
		throw new Error('Method not implemented.');
	}
}
