import { beforeEach, describe, expect, it } from 'vitest';

import { Command } from '@/src/Command.js';
import { CommandRegistry } from '@/src/CommandRegistry.js';
import { CommandWithSignature } from '@/src/CommandWithSignature.js';
import { Args } from '@/src/args/index.js';
import { completeArgv, parseCompletionRequest } from '@/src/completion/complete.js';
import { commandSpecs } from '@/src/completion/specs.js';
import { Flags } from '@/src/flags/index.js';
import type { FlagsSchema } from '@/src/lib/types.js';

class DeployCommand extends Command {
	static command = 'deploy';
	static description = 'Ship it';
	static aliases = ['dep'];

	static args = {
		target: Args.option({ options: ['api', 'worker'] as const }),
		note: Args.string(),
	} satisfies FlagsSchema;

	static flags = {
		env: Flags.option({ options: ['dev', 'prd'] as const, description: 'Environment', alias: 'e' }),
		force: Flags.boolean({ description: 'Skip confirmation', alias: 'f' }),
		tag: Flags.string({ description: 'Image tag', multiple: true }),
	} satisfies FlagsSchema;

	async handle() {}
}

class SecretCommand extends Command {
	static command = 'secret';
	static description = 'Not for humans';
	static hidden = true;
	async handle() {}
}

class BareCommand extends Command {
	static command = 'bare';
	static description = 'No base flags';
	static disableDefaultOptions = true;
	static flags = { only: Flags.boolean() } satisfies FlagsSchema;
	async handle() {}
}

class LegacyCommand extends CommandWithSignature {
	static signature = 'uuid {date*?} {--zeroed|z} {--parse|p=}';
	static description = 'Legacy signature command';
	static helperDefinitions = { zeroed: 'Return a nil UUID' };
	async handle() {}
}

/** Resolves against a freshly snapshotted registry, the way a host CLI does. */
function complete(registry: CommandRegistry, words: string[]) {
	return completeArgv(commandSpecs(registry), words).candidates;
}

/** Candidate values only — descriptions are asserted explicitly where they matter. */
function values(registry: CommandRegistry, words: string[]): string[] {
	return complete(registry, words).map(candidate => candidate.value);
}

describe('completeArgv', () => {
	let registry: CommandRegistry;

	beforeEach(() => {
		registry = new CommandRegistry();
		registry.registerCommand(DeployCommand);
		registry.registerCommand(SecretCommand);
		registry.registerCommand(BareCommand);
		registry.registerCommand(LegacyCommand);
	});

	describe('command position', () => {
		it('offers every command name so the shell can list what the CLI can do', () => {
			expect(values(registry, [''])).toContain('deploy');
			expect(values(registry, [''])).toContain('bare');
		});

		it('carries descriptions through, since that is what makes completion a discovery tool', () => {
			const deploy = complete(registry, ['']).find(candidate => candidate.value === 'deploy');

			expect(deploy?.description).toBe('Ship it');
		});

		it('offers aliases, because a user who types the alias must still get a completion', () => {
			expect(values(registry, [''])).toContain('dep');
		});

		it('omits hidden commands — they are deliberately kept off the discovery surface', () => {
			expect(values(registry, [''])).not.toContain('secret');
		});

		it('filters by the typed prefix so bash and zsh, which do not filter, behave like fish', () => {
			expect(values(registry, ['de'])).toEqual(['deploy', 'dep']);
		});
	});

	describe('flag position', () => {
		it('offers long and short forms, so a half-typed short flag still completes', () => {
			const candidates = values(registry, ['deploy', '-']);

			expect(candidates).toContain('--force');
			expect(candidates).toContain('-f');
		});

		it('narrows to long forms once the second dash is typed', () => {
			const candidates = values(registry, ['deploy', '--']);

			expect(candidates).toContain('--force');
			expect(candidates).not.toContain('-f');
		});

		it('includes inherited baseFlags, which the parser accepts but no command declares', () => {
			expect(values(registry, ['deploy', '--'])).toContain('--help');
		});

		it('excludes baseFlags when the command opted out, matching what the parser will accept', () => {
			expect(values(registry, ['bare', '--'])).not.toContain('--help');
			expect(values(registry, ['bare', '--'])).toContain('--only');
		});

		it('drops a flag already on the line — re-offering it invites an invalid command', () => {
			const candidates = values(registry, ['deploy', '--force', '--']);

			expect(candidates).not.toContain('--force');
			expect(candidates).toContain('--env');
		});

		it('recognises the short form as "already used", since the parser treats them as one flag', () => {
			expect(values(registry, ['deploy', '-f', '--'])).not.toContain('--force');
		});

		it('keeps offering a repeatable flag, because supplying it twice is the point', () => {
			expect(values(registry, ['deploy', '--tag', 'v1', '--'])).toContain('--tag');
		});

		it('surfaces flag descriptions', () => {
			const force = complete(registry, ['deploy', '--force']).find(candidate => candidate.value === '--force');

			expect(force?.description).toBe('Skip confirmation');
		});
	});

	describe('flag values', () => {
		it('offers exactly the allowed options, which is the whole point of Flags.option', () => {
			expect(values(registry, ['deploy', '--env', ''])).toEqual(['dev', 'prd']);
		});

		it('completes inside the --flag=value form, which arrives as a single token', () => {
			expect(values(registry, ['deploy', '--env=d'])).toEqual(['--env=dev']);
		});

		it('offers option values for a short alias too', () => {
			expect(values(registry, ['deploy', '-e', ''])).toEqual(['dev', 'prd']);
		});

		it('offers nothing for a free-form flag rather than guessing', () => {
			expect(values(registry, ['deploy', '--tag', ''])).toEqual([]);
		});

		it('does not treat the token after a boolean flag as its value — booleans stand alone', () => {
			// `--force` consumes nothing, so the cursor is on the first positional.
			expect(values(registry, ['deploy', '--force', ''])).toEqual(['api', 'worker']);
		});
	});

	describe('positional arguments', () => {
		it('offers the first positional option set', () => {
			expect(values(registry, ['deploy', ''])).toEqual(['api', 'worker']);
		});

		it('moves to the next positional once the first is filled', () => {
			// `note` is free-form, so there is nothing to suggest — and crucially not `api`/`worker` again.
			expect(values(registry, ['deploy', 'api', ''])).toEqual([]);
		});

		it('counts past flags and the values they consume when locating the positional', () => {
			expect(values(registry, ['deploy', '--env', 'dev', ''])).toEqual(['api', 'worker']);
		});

		it('offers nothing beyond the declared positionals instead of repeating the last one', () => {
			expect(values(registry, ['deploy', 'api', 'a note', ''])).toEqual([]);
		});
	});

	describe('legacy signature commands', () => {
		it('materializes the signature schema, which is otherwise only built on first run', () => {
			const candidates = values(registry, ['uuid', '-']);

			expect(candidates).toContain('--zeroed');
			expect(candidates).toContain('-z');
			expect(candidates).toContain('--parse');
		});

		it('carries helperDefinitions through as descriptions', () => {
			const zeroed = complete(registry, ['uuid', '--zeroed']).find(candidate => candidate.value === '--zeroed');

			expect(zeroed?.description).toBe('Return a nil UUID');
		});
	});

	describe('parseCompletionRequest', () => {
		it('reads the shell and the line as typed, dropping the binary name', () => {
			expect(parseCompletionRequest(['fish', '--current=k9', '--', 'bdg', 'deploy'])).toEqual({
				shell: 'fish',
				words: ['deploy', 'k9'],
			});
		});

		it('distinguishes "cmd <TAB>" from "cmd<TAB>", which is why the token travels in a flag', () => {
			// Trailing-argument forms cannot tell these apart: an empty command substitution
			// contributes zero arguments in fish, so both would arrive as the same argv.
			const onFreshSpace = parseCompletionRequest(['fish', '--current=', '--', 'bdg', 'deploy']);
			const midWord = parseCompletionRequest(['fish', '--current=deploy', '--', 'bdg']);

			expect(onFreshSpace?.words).toEqual(['deploy', '']);
			expect(midWord?.words).toEqual(['deploy']);
		});

		it('rejects an unknown shell rather than guessing a dialect', () => {
			expect(parseCompletionRequest(['not-a-shell', '--current=', '--', 'bdg'])).toBeNull();
		});

		it('treats a missing current token as empty', () => {
			expect(parseCompletionRequest(['fish', '--', 'bdg', 'deploy'])?.words).toEqual(['deploy', '']);
		});

		it('survives a missing separator instead of throwing', () => {
			expect(parseCompletionRequest(['fish', '--current=de'])?.words).toEqual(['de']);
		});
	});

	describe('robustness', () => {
		it('returns nothing for an unknown command instead of throwing over the user prompt', () => {
			expect(complete(registry, ['nope-xyz', '--'])).toEqual([]);
		});

		it('treats an empty line as the command position', () => {
			expect(values(registry, [])).toContain('deploy');
		});

		it('resolves a command reached by its alias', () => {
			expect(values(registry, ['dep', '--'])).toContain('--force');
		});
	});
});
