import { CommandSpec, ParameterSpec } from '@/src/completion/specs.js';
import { COMPLETION_SHELLS, CURRENT_TOKEN_FLAG, CompletionCandidate, CompletionShell } from '@/src/completion/types.js';

/** Identifies a slot whose values can only be produced by running the command's `complete`. */
export type DynamicSlot = {
	/** Canonical command name, so the resolver can look the class up. */
	command: string;
	kind: 'flag' | 'arg';
	parameter: string;
	/** The partial value typed so far, handed to `complete` as its search term. */
	term: string;
	/** Prepended to every resolved value — non-empty for the `--flag=value` form. */
	prefix: string;
};

export type CompletionPlan = {
	candidates: CompletionCandidate[];
	/** Set when the slot under the cursor resolves its values at runtime. */
	dynamic?: DynamicSlot;
};

/**
 * Resolves the suggestions for a partially typed command line.
 *
 * `words` holds the tokens typed *after* the binary name, with the token under the cursor last —
 * an empty string when the cursor sits on fresh whitespace.
 *
 * Candidates are filtered by that token here rather than left to the shell: fish filters on its
 * own, but bash and zsh do not, so doing it once keeps every dialect honest.
 *
 * Purely static and never throws: an unresolvable line yields no candidates. Anything whose values
 * are only knowable at runtime is reported as {@link CompletionPlan.dynamic} for the caller to
 * resolve — see `resolveCompletion`.
 */
export function completeArgv(specs: CommandSpec[], words: string[]): CompletionPlan {
	const current = words.at(-1) ?? '';
	const preceding = words.slice(0, -1);

	if (preceding.length === 0) {
		return { candidates: filterByPrefix(commandCandidates(specs), current) };
	}

	const spec = findSpec(specs, preceding[0]);
	if (!spec) return { candidates: [] };

	// `--flag=value` reaches us as one token, so the value has to be completed from inside it.
	const assignment = /^(--[^=]+)=(.*)$/.exec(current);
	if (assignment) {
		const [, flagToken, valuePrefix] = assignment;
		const flag = findFlag(spec, flagToken);
		if (!flag || !flag.takesValue) return { candidates: [] };

		const candidates = valueCandidates(flag).map(candidate => ({ ...candidate, value: `${flagToken}=${candidate.value}` }));

		return {
			candidates: filterByPrefix(candidates, current),
			...dynamicSlot(spec, flag, 'flag', valuePrefix, `${flagToken}=`),
		};
	}

	if (current.startsWith('-')) {
		return { candidates: filterByPrefix(flagCandidates(spec, preceding), current) };
	}

	const previous = preceding.at(-1) ?? '';
	if (previous.startsWith('-')) {
		const flag = findFlag(spec, previous);
		if (flag?.takesValue) {
			return {
				candidates: filterByPrefix(valueCandidates(flag), current),
				...dynamicSlot(spec, flag, 'flag', current, ''),
			};
		}
	}

	const positional = positionalAt(spec, preceding);

	return {
		candidates: filterByPrefix(positional ? valueCandidates(positional) : [], current),
		...(positional ? dynamicSlot(spec, positional, 'arg', current, '') : {}),
	};
}

/** Spread into a plan: yields `{ dynamic }` only when the parameter actually declares `complete`. */
function dynamicSlot(spec: CommandSpec, parameter: ParameterSpec, kind: 'flag' | 'arg', term: string, prefix: string): { dynamic?: DynamicSlot } {
	if (!parameter.dynamic) return {};

	return { dynamic: { command: spec.name, kind, parameter: parameter.name, term, prefix } };
}

/**
 * Reads the wire protocol the generated shell scripts speak:
 * `<shell> --current=<token> -- <tokens…>`. Returns `null` for anything unrecognisable.
 */
export function parseCompletionRequest(argv: string[]): { shell: CompletionShell; words: string[] } | null {
	const shell = argv[0] as CompletionShell;
	if (!COMPLETION_SHELLS.includes(shell)) return null;

	const current = argv.find(arg => arg.startsWith(CURRENT_TOKEN_FLAG))?.slice(CURRENT_TOKEN_FLAG.length) ?? '';

	// Everything after `--` is the line as typed, starting with the binary name itself — which
	// `completeArgv` does not want, hence the extra offset.
	const separator = argv.indexOf('--');
	const typed = separator === -1 ? [] : argv.slice(separator + 2);

	return { shell, words: [...typed, current] };
}

function filterByPrefix(candidates: CompletionCandidate[], prefix: string): CompletionCandidate[] {
	if (!prefix) return candidates;

	return candidates.filter(candidate => candidate.value.startsWith(prefix));
}

/** Every runnable name — canonical commands and their aliases — except hidden ones. */
function commandCandidates(specs: CommandSpec[]): CompletionCandidate[] {
	const candidates: CompletionCandidate[] = [];

	for (const spec of specs) {
		if (spec.hidden) continue;

		candidates.push({ value: spec.name, description: spec.description });
		for (const alias of spec.aliases) {
			candidates.push({ value: alias, description: spec.description });
		}
	}

	return candidates;
}

function findSpec(specs: CommandSpec[], name: string): CommandSpec | null {
	return specs.find(spec => spec.name === name || spec.aliases.includes(name)) ?? null;
}

/** `-v` for single characters, `--verbose` otherwise — the form the parser accepts via minimist. */
function toToken(name: string): string {
	return name.length === 1 ? `-${name}` : `--${name}`;
}

function findFlag(spec: CommandSpec, token: string): ParameterSpec | null {
	const name = token.replace(/^-+/, '');
	if (!name) return null;

	return spec.flags.find(flag => flag.name === name || flag.aliases.includes(name)) ?? null;
}

function isUsed(flag: ParameterSpec, tokens: string[]): boolean {
	const forms = [flag.name, ...flag.aliases].map(toToken);

	return tokens.some(token => forms.some(form => token === form || token.startsWith(`${form}=`)));
}

function flagCandidates(spec: CommandSpec, preceding: string[]): CompletionCandidate[] {
	const candidates: CompletionCandidate[] = [];

	for (const flag of spec.flags) {
		// Repeatable flags stay on offer; everything else is dropped once it appears on the line.
		if (!flag.multiple && isUsed(flag, preceding)) continue;

		candidates.push({ value: `--${flag.name}`, description: flag.description });
		for (const alias of flag.aliases) {
			candidates.push({ value: toToken(alias), description: flag.description });
		}
	}

	return candidates;
}

/** Enumerable values only — anything free-form gets no suggestion rather than a guess. */
function valueCandidates(parameter: ParameterSpec): CompletionCandidate[] {
	return (parameter.options ?? []).map(option => ({ value: option }));
}

/**
 * The positional slot the cursor is in, which means counting how many positionals are already
 * filled — skipping flags and the values they consume.
 */
function positionalAt(spec: CommandSpec, preceding: string[]): ParameterSpec | null {
	const tokens = preceding.slice(1);
	let filled = 0;

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (token === '--') continue;

		if (token.startsWith('-')) {
			const flag = findFlag(spec, token.split('=')[0]);
			// `--flag value` eats the next token; `--flag=value` carries its own.
			if (flag?.takesValue && !token.includes('=')) i++;
			continue;
		}

		filled++;
	}

	// A variadic positional swallows every remaining token, so it stays selected past its own slot.
	const variadicAt = spec.args.findIndex(arg => arg.multiple);

	return (variadicAt !== -1 && filled >= variadicAt ? spec.args[variadicAt] : spec.args[filled]) ?? null;
}
