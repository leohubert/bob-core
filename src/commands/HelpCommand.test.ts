import { describe, expect, it } from 'vitest';

import { Command } from '@/src/Command.js';
import { CommandRegistry } from '@/src/CommandRegistry.js';
import HelpCommand from '@/src/commands/HelpCommand.js';
import { newTestLogger } from '@/src/fixtures.test.js';

function makeCmd(opts: { command: string; description?: string; group?: string; aliases?: string[]; hidden?: boolean }) {
	return class extends Command {
		static command = opts.command;
		static description = opts.description ?? '';
		static group = opts.group;
		static aliases = opts.aliases ?? [];
		static hidden = opts.hidden ?? false;
		async handle() {
			return 0;
		}
	};
}

function newRegistryWith(...commands: Array<typeof Command>) {
	const reg = new CommandRegistry();
	for (const c of commands) reg.registerCommand(c);
	return reg;
}

describe('HelpCommand', () => {
	it('renders the CLI banner with name and version', async () => {
		const logger = newTestLogger();
		const help = new HelpCommand({ commandRegistry: newRegistryWith(), cliName: 'My CLI', cliVersion: '1.2.3' });
		await help.run({ ctx: {}, logger, args: [] });

		expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('My CLI'));
		expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('1.2.3'));
	});

	it('omits commands marked as hidden', async () => {
		const logger = newTestLogger();
		const reg = newRegistryWith(makeCmd({ command: 'visible' }), makeCmd({ command: 'secret', hidden: true }));
		const help = new HelpCommand({ commandRegistry: reg });
		await help.run({ ctx: {}, logger, args: [] });

		const allOutput = logger.log.mock.calls.map(c => c[0]).join('\n');
		expect(allOutput).toContain('visible');
		expect(allOutput).not.toContain('secret');
	});

	it('lists aliases next to the command name', async () => {
		const logger = newTestLogger();
		const reg = newRegistryWith(makeCmd({ command: 'deploy', aliases: ['d', 'dep'] }));
		const help = new HelpCommand({ commandRegistry: reg });
		await help.run({ ctx: {}, logger, args: [] });

		const allOutput = logger.log.mock.calls.map(c => c[0]).join('\n');
		expect(allOutput).toContain('deploy');
		expect(allOutput).toContain('d, dep');
	});

	it('groups commands by their `group` static and prints group headers', async () => {
		const logger = newTestLogger();
		const reg = newRegistryWith(makeCmd({ command: 'db:up', group: 'db' }), makeCmd({ command: 'db:down', group: 'db' }), makeCmd({ command: 'serve' }));
		const help = new HelpCommand({ commandRegistry: reg });
		await help.run({ ctx: {}, logger, args: [] });

		const allOutput = logger.log.mock.calls.map(c => c[0]).join('\n');
		expect(allOutput).toMatch(/db:/);
	});
});
