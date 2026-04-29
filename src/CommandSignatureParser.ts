import { Args } from '@/src/args/index.js';
import { Flags } from '@/src/flags/index.js';
import { ArgsSchema, FlagDefinition, FlagsSchema } from '@/src/lib/types.js';

/**
 * @deprecated This class is deprecated and will be removed in future versions. Use CommandParser with explicit schema definitions instead.
 * Parses command signature strings like "command {arg} {--option}" into
 * FlagsSchema and ArgsSchema using Flags/Args factories.
 */
export class CommandSignatureParser {
	/**
	 * Parses a command signature string into command name, flags, and args schemas.
	 *
	 * @example
	 * CommandSignatureParser.parse('migrate {name} {--force}')
	 * // => { command: 'migrate', flags: { force: Flags.boolean() }, args: { name: Args.string({ required: true }) } }
	 */
	static parse(signature: string, helperDefinitions: Record<string, string> = {}): { command: string; flags: FlagsSchema; args: FlagsSchema } {
		const [command, ...signatureParams] = signature
			.split(/\{(.*?)\}/g)
			.map(param => param.trim())
			.filter(Boolean);

		const flags: FlagsSchema = {};
		const args: ArgsSchema = {};

		for (const paramSignature of signatureParams) {
			const result = CommandSignatureParser.parseParamSignature(paramSignature, helperDefinitions);

			if (result.isFlag) {
				flags[result.name] = result.definition as FlagDefinition;
			} else {
				args[result.name] = result.definition as FlagDefinition;
			}
		}

		return { command, flags, args };
	}

	/**
	 * Parses a single parameter signature into a FlagDefinition or ArgDefinition.
	 *
	 * Signature syntax:
	 * - {arg}          -> required string argument
	 * - {arg?}         -> optional argument
	 * - {arg=default}  -> argument with default value
	 * - {arg*}         -> variadic argument (array)
	 * - {arg:desc}     -> argument with description
	 * - {--opt}        -> boolean flag
	 * - {--opt=}       -> string flag
	 * - {--opt=default} -> string flag with default
	 * - {--opt=*}      -> array flag
	 * - {--opt|o}      -> flag with alias
	 * - {--opt=true}   -> boolean flag with default true
	 */
	private static parseParamSignature(
		paramSignature: string,
		helperDefinitions: Record<string, string>,
	): { name: string; isFlag: boolean; definition: FlagDefinition } {
		let name = paramSignature;
		let isFlag = false;
		let description: string | undefined;
		let defaultValue: any = undefined;
		let alias: string[] | undefined;
		let isBooleanType = false;
		let isMultiple = false;
		let isRequired = true;

		// Extract description {arg:description}
		if (name.includes(':')) {
			const [paramName, desc] = name.split(':');
			name = paramName.trim();
			description = desc.trim();
		}

		// Extract default value {arg=default}
		if (name.includes('=')) {
			const [paramName, defVal] = name.split('=');
			name = paramName.trim();
			const trimmedDefault = defVal.trim();
			isRequired = false;

			if (!trimmedDefault.length) {
				// {--opt=} -> string with no default
				defaultValue = null;
			} else if (trimmedDefault === '*') {
				// {--opt=*} -> array type
				isMultiple = true;
				defaultValue = [];
			} else if (trimmedDefault === 'true') {
				isBooleanType = true;
				defaultValue = true;
			} else if (trimmedDefault === 'false') {
				isBooleanType = true;
				defaultValue = false;
			} else {
				defaultValue = trimmedDefault;
			}
		} else if (name.startsWith('--')) {
			// Boolean flag without explicit default
			isBooleanType = true;
			isRequired = false;
			defaultValue = false;
		}

		// Extract aliases {arg|a|alias}
		if (name.includes('|')) {
			const [paramName, ...aliases] = name.split('|');
			name = paramName.trim();
			alias = aliases.map(a => a.trim());
		}

		// Detect flag prefix
		if (name.startsWith('--')) {
			isFlag = true;
			name = name.slice(2);
		}

		// Optional marker {arg?}
		if (name.endsWith('?')) {
			isRequired = false;
			name = name.slice(0, -1);
		}

		// Variadic marker {arg*}
		if (name.endsWith('*')) {
			isMultiple = true;
			defaultValue = [];
			name = name.slice(0, -1);
		}

		// Resolve description from helperDefinitions
		description = description ?? helperDefinitions[name] ?? helperDefinitions[`--${name}`];

		// Build the definition using Flags/Args factories
		let definition: FlagDefinition;

		if (isFlag) {
			if (isBooleanType) {
				definition = Flags.boolean({
					description,
					alias,
					...(defaultValue !== undefined ? { default: defaultValue } : {}),
				});
			} else if (isMultiple) {
				definition = Flags.string({
					description,
					alias,
					multiple: true,
					...(isRequired ? { required: true } : {}),
					default: defaultValue ?? [],
				});
			} else {
				definition = Flags.string({
					description,
					alias,
					...(isRequired ? { required: true } : {}),
					...(defaultValue !== undefined ? { default: defaultValue } : {}),
				});
			}
		} else {
			if (isMultiple) {
				definition = Args.string({
					description,
					multiple: true,
					...(isRequired ? { required: true } : {}),
					default: defaultValue ?? [],
				});
			} else {
				definition = Args.string({
					description,
					...(isRequired ? { required: true } : {}),
					...(defaultValue !== undefined ? { default: defaultValue } : {}),
				});
			}
		}

		return { name, isFlag, definition };
	}
}
