import { describe, expect, it } from 'vitest';

import { Command } from '@/src/Command.js';
import { CommandRegistry } from '@/src/CommandRegistry.js';
import { CommandWithSignature } from '@/src/CommandWithSignature.js';
import { Args } from '@/src/args/index.js';
import { completeArgv } from '@/src/completion/complete.js';
import { commandSpecs } from '@/src/completion/specs.js';
import { Flags } from '@/src/flags/index.js';
import type { FlagsSchema } from '@/src/lib/types.js';

class DeployCommand extends Command {
	static command = 'deploy';
	static description = 'Ship it';
	static aliases = ['dep'];
	static args = { target: Args.option({ options: ['api', 'worker'] as const }) } satisfies FlagsSchema;
	static flags = {
		env: Flags.option({ options: ['dev', 'prd'] as const, description: 'Environment', alias: 'e' }),
		force: Flags.boolean({ alias: ['f', 'yes'] }),
		tag: Flags.string({ multiple: true }),
	} satisfies FlagsSchema;
	async handle() {}
}

class HiddenCommand extends Command {
	static command = 'hidden-one';
	static hidden = true;
	async handle() {}
}

class LegacyCommand extends CommandWithSignature {
	static signature = 'uuid {--zeroed|z}';
	static helperDefinitions = { zeroed: 'Return a nil UUID' };
	async handle() {}
}

function registryWith(...commands: Array<typeof Command>): CommandRegistry {
	const registry = new CommandRegistry();
	for (const command of commands) registry.registerCommand(command);

	return registry;
}

function specFor(registry: CommandRegistry, name: string) {
	return commandSpecs(registry).find(spec => spec.name === name);
}

describe('commandSpecs', () => {
	it('captures the identity a shell shows the user', () => {
		const spec = specFor(registryWith(DeployCommand), 'deploy');

		expect(spec).toMatchObject({ name: 'deploy', description: 'Ship it', aliases: ['dep'], hidden: false });
	});

	it('includes hidden commands, so the snapshot stays the whole truth', () => {
		// Hiding is applied when candidates are produced, not when the snapshot is taken — otherwise
		// a cached snapshot could not answer for a hidden-but-runnable command.
		expect(specFor(registryWith(HiddenCommand), 'hidden-one')?.hidden).toBe(true);
	});

	it('merges baseFlags in, matching what the parser will accept', () => {
		const spec = specFor(registryWith(DeployCommand), 'deploy');

		expect(spec?.flags.map(flag => flag.name)).toContain('help');
	});

	it('marks only booleans as not taking a value — that is what decides token consumption', () => {
		const flags = specFor(registryWith(DeployCommand), 'deploy')?.flags ?? [];

		expect(flags.find(flag => flag.name === 'force')?.takesValue).toBe(false);
		expect(flags.find(flag => flag.name === 'env')?.takesValue).toBe(true);
	});

	it('normalises a single alias and an alias list to the same shape', () => {
		const flags = specFor(registryWith(DeployCommand), 'deploy')?.flags ?? [];

		expect(flags.find(flag => flag.name === 'env')?.aliases).toEqual(['e']);
		expect(flags.find(flag => flag.name === 'force')?.aliases).toEqual(['f', 'yes']);
	});

	it('carries the closed value set, which is the only thing values can be completed from', () => {
		const flags = specFor(registryWith(DeployCommand), 'deploy')?.flags ?? [];

		expect(flags.find(flag => flag.name === 'env')?.options).toEqual(['dev', 'prd']);
		expect(flags.find(flag => flag.name === 'tag')?.options).toBeUndefined();
	});

	it('keeps positional order, since position is what identifies a positional', () => {
		class TwoArgs extends Command {
			static command = 'two';
			static args = { first: Args.string(), second: Args.string() } satisfies FlagsSchema;
			async handle() {}
		}

		expect(specFor(registryWith(TwoArgs), 'two')?.args.map(arg => arg.name)).toEqual(['first', 'second']);
	});

	it('materializes a legacy signature schema, which is otherwise only built on first run', () => {
		const spec = specFor(registryWith(LegacyCommand), 'uuid');

		expect(spec?.flags.find(flag => flag.name === 'zeroed')).toMatchObject({
			aliases: ['z'],
			description: 'Return a nil UUID',
		});
	});

	describe('serializability', () => {
		it('survives a JSON round-trip unchanged — this is what makes the snapshot cacheable', () => {
			const specs = commandSpecs(registryWith(DeployCommand, LegacyCommand, HiddenCommand));

			expect(JSON.parse(JSON.stringify(specs))).toEqual(specs);
		});

		it('produces identical candidates before and after a round-trip', () => {
			// The property a host CLI relies on when it answers keypresses from a cache file rather
			// than from freshly imported command modules.
			const registry = registryWith(DeployCommand, LegacyCommand);
			const specs = commandSpecs(registry);
			const revived = JSON.parse(JSON.stringify(specs));

			for (const words of [[''], ['deploy', '-'], ['deploy', '--env', ''], ['deploy', ''], ['uuid', '--']]) {
				expect(completeArgv(revived, words)).toEqual(completeArgv(specs, words));
			}
		});
	});
});
