import { Command, CommandContext } from '../../command.js';

export default class SubCommand extends Command {
	static override signature = 'sub {name*?}';
	static override description = 'sub command description';

	static override disablePrompting = true;

	protected async handle(ctx: CommandContext, opts: any): Promise<void> {
		using loader = this.ux.newLoader('Loading something...');

		await new Promise(resolve => {
			setTimeout(() => loader.updateText('test'), 1000);
			setTimeout(() => {
				loader.stop();
				this.logger.info('Sub command executed', ctx, opts);
				resolve(2);
			}, 3000);
		});
	}
}
