import chalk from 'chalk';
import { describe, expect, it } from 'vitest';

import { encodeFishCandidates, renderFishScript } from '@/src/completion/fish.js';

const ESC = String.fromCharCode(27);

describe('renderFishScript', () => {
	it('calls the binary by name, since the script is what wires the two together', () => {
		const script = renderFishScript({ binName: 'bdg' });

		expect(script).toContain('complete -c bdg');
		expect(script).toContain('bdg __complete fish');
	});

	it('passes the current token via a variable, because fish will not substitute inside quotes', () => {
		const script = renderFishScript({ binName: 'bdg' });

		// An inline `"--current=(commandline -ct)"` is handed over literally by fish — the bug this
		// guards against. Quoting the *variable* is still required so an empty token stays one
		// argument, which is what distinguishes "bdg k9s <TAB>" from "bdg k9s<TAB>".
		expect(script).toContain('set -l token (commandline -ct)');

		const invocation = script.split('\n').find(line => line.includes('__complete fish')) ?? '';
		expect(invocation).toContain('"--current=$token"');
		expect(invocation).not.toContain('(commandline -ct)');
	});

	it('suppresses filename completion so the candidate list is entirely ours', () => {
		expect(renderFishScript({ binName: 'bdg' })).toContain('complete -c bdg -f');
	});

	it('sanitizes the binary name into a legal fish function name', () => {
		const script = renderFishScript({ binName: 'my-cli.v2' });

		expect(script).toContain('function __my_cli_v2_complete');
		// The binary itself is still invoked under its real name.
		expect(script).toContain('my-cli.v2 __complete fish');
	});
});

describe('encodeFishCandidates', () => {
	it('separates value and description with a tab, which is what fish parses', () => {
		expect(encodeFishCandidates([{ value: 'deploy', description: 'Ship it' }])).toBe('deploy\tShip it');
	});

	it('emits a bare value when there is no description', () => {
		expect(encodeFishCandidates([{ value: 'deploy' }])).toBe('deploy');
	});

	it('puts one candidate per line', () => {
		expect(encodeFishCandidates([{ value: 'a' }, { value: 'b' }])).toBe('a\nb');
	});

	it('strips newlines and tabs from descriptions, which would otherwise forge extra candidates', () => {
		const encoded = encodeFishCandidates([{ value: 'deploy', description: 'first\nsecond\tthird' }]);

		expect(encoded).toBe('deploy\tfirst second third');
		expect(encoded.split('\n')).toHaveLength(1);
	});

	it('strips ANSI styling, because descriptions are written for the help screen', () => {
		// Built explicitly rather than via chalk: chalk emits nothing when colour support is off
		// (CI, NO_COLOR), which would leave this test unable to fail.
		const styled = `${ESC}[1m${ESC}[32mShow help${ESC}[39m${ESC}[22m`;
		expect(styled).not.toBe('Show help');

		expect(encodeFishCandidates([{ value: 'help', description: styled }])).toBe('help\tShow help');
	});

	it('strips the styling chalk actually produces for a command description', () => {
		const encoded = encodeFishCandidates([{ value: 'help', description: chalk.bold('Show help') }]);

		expect(encoded).toBe('help\tShow help');
	});
});
