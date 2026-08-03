import { Command } from '@/src/Command.js';
import { CommandRegistry } from '@/src/CommandRegistry.js';
import { FlagDefinition, FlagsSchema } from '@/src/lib/types.js';

/**
 * Everything completion needs to know about one flag or positional argument.
 *
 * Deliberately plain JSON: a host CLI whose startup is dominated by importing command modules can
 * snapshot these to disk and answer keypresses without loading a single command.
 */
export type ParameterSpec = {
	name: string;
	aliases: string[];
	description?: string;
	/** False only for booleans, which stand alone rather than consuming the next token. */
	takesValue: boolean;
	multiple: boolean;
	/** The closed set of accepted values, when the parameter has one. */
	options?: string[];
	/**
	 * True when the parameter declares a `complete` callback, i.e. its values are resolved at
	 * completion time rather than known statically. A cached snapshot can only say *that* a slot is
	 * dynamic — resolving it means loading the real command.
	 */
	dynamic: boolean;
};

export type CommandSpec = {
	name: string;
	description?: string;
	aliases: string[];
	hidden: boolean;
	/** Already merged with `baseFlags`, matching what the parser will accept. */
	flags: ParameterSpec[];
	/** Ordered, because position is what identifies a positional argument. */
	args: ParameterSpec[];
};

function aliasesOf(definition: FlagDefinition): string[] {
	const alias = definition.alias;
	if (!alias) return [];

	return typeof alias === 'string' ? [alias] : [...alias];
}

function toParameterSpec(name: string, definition: FlagDefinition): ParameterSpec {
	const options = (definition as { options?: unknown }).options;

	return {
		name,
		aliases: aliasesOf(definition),
		...(definition.description ? { description: definition.description } : {}),
		takesValue: definition.type !== 'boolean',
		multiple: Boolean(definition.multiple),
		...(Array.isArray(options) ? { options: options.map(option => String(option)) } : {}),
		dynamic: typeof definition.complete === 'function',
	};
}

function toParameterSpecs(schema: FlagsSchema): ParameterSpec[] {
	return Object.entries(schema).map(([name, definition]) => toParameterSpec(name, definition));
}

function toCommandSpec(Cmd: typeof Command): CommandSpec {
	// Legacy signature commands only materialize their schema on first run, so completion has to ask
	// for it — otherwise every `{--force|f}` style flag is invisible to the shell.
	if ('ensureSchema' in Cmd && typeof Cmd.ensureSchema === 'function') {
		Cmd.ensureSchema();
	}

	const flags = Cmd.disableDefaultOptions ? Cmd.flags : { ...Cmd.baseFlags, ...Cmd.flags };

	return {
		name: Cmd.command,
		...(Cmd.description ? { description: Cmd.description } : {}),
		aliases: [...Cmd.aliases],
		hidden: Cmd.hidden,
		flags: toParameterSpecs(flags),
		args: toParameterSpecs(Cmd.args),
	};
}

/**
 * Snapshots every registered command into the plain form {@link completeArgv} consumes.
 *
 * Hidden commands are included: the snapshot is the whole truth, and hiding is applied when
 * candidates are produced.
 */
export function commandSpecs(registry: CommandRegistry): CommandSpec[] {
	return registry.getCommands().map(toCommandSpec);
}
