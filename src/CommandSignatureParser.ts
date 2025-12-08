import { Command } from '@/src/Command.js';
import { CommandIO } from '@/src/CommandIO.js';
import { CommandParser } from '@/src/CommandParser.js';
import { CommandOption } from '@/src/contracts/index.js';
import { OptionDefinition, OptionsSchema } from '@/src/lib/types.js';

/**
 * Extends CommandParser to parse command signatures like "command {arg} {--option}"
 * Handles interactive prompting for missing required arguments via CommandIO
 */
export class CommandSignatureParser<Opts extends OptionsSchema = OptionsSchema, Args extends OptionsSchema = OptionsSchema> extends CommandParser<Opts, Args> {
	public readonly command: string;

	constructor(opts: { io: CommandIO; signature: string; helperDefinitions: { [key: string]: string }; defaultOptions: CommandOption<Command>[] }) {
		// Parse signature to extract command name and parameter schemas
		const parseResult = CommandSignatureParser.parseSignature<Opts, Args>(opts.signature, opts.helperDefinitions, opts.defaultOptions);

		// Initialize parent with schemas
		super({
			io: opts.io,
			options: parseResult.options,
			arguments: parseResult.arguments,
		});

		// Store parsed definitions for later access
		this.command = parseResult.command;
	}

	/**
	 * Parses command signature string into command name and parameter schemas
	 * Example: "migrate {name} {--force}" -> { command: "migrate", arguments: {name: ...}, options: {force: ...} }
	 */
	private static parseSignature<Opts extends OptionsSchema, Args extends OptionsSchema>(
		signature: string,
		helperDefinitions: { [key: string]: string },
		defaultCommandOptions: CommandOption<Command>[],
	): { command: string; options: Opts; arguments: Args } {
		const [command, ...signatureParams] = signature
			.split(/\{(.*?)\}/g)
			.map(param => param.trim())
			.filter(Boolean);

		const optionsSchema: OptionsSchema = {};
		const argumentsSchema: OptionsSchema = {};

		// Parse each {param} from signature
		for (const paramSignature of signatureParams) {
			const { name, isOption, definition } = CommandSignatureParser.parseParamSignature(paramSignature, helperDefinitions);

			if (isOption) {
				optionsSchema[name] = definition;
			} else {
				argumentsSchema[name] = definition;
			}
		}

		// Add default command options (e.g., global --help, --version)
		for (const option of defaultCommandOptions) {
			optionsSchema[option.option] = {
				type: option.type,
				required: option.required,
				alias: option.alias,
				variadic: option.variadic ?? false,
				description: option.description,
				default: option.default ?? null,
			};
		}

		return {
			command,
			options: optionsSchema as Opts,
			arguments: argumentsSchema as Args,
		};
	}

	/**
	 * Parses a single parameter signature like "{name}" or "{--force}" or "{files*}"
	 * Extracts name, type, default value, aliases, description, etc.
	 *
	 * Signature syntax:
	 * - {arg}          -> required string argument
	 * - {arg?}         -> optional argument
	 * - {arg=default}  -> argument with default value
	 * - {arg*}         -> variadic argument (array)
	 * - {arg:desc}     -> argument with description
	 * - {--opt}        -> boolean option
	 * - {--opt=}       -> string option
	 * - {--opt|o}      -> option with alias
	 */
	private static parseParamSignature(
		paramSignature: string,
		helperDefinitions: { [key: string]: string },
	): { name: string; isOption: boolean; definition: OptionDefinition } {
		let name = paramSignature;
		let isOption = false;
		const definition: OptionDefinition = {
			required: true,
			type: 'string',
			description: undefined,
			default: null,
			variadic: false,
		};

		// Extract description {arg:description}
		if (name.includes(':')) {
			const [paramName, description] = name.split(':');
			name = paramName.trim();
			definition.description = description.trim();
		}

		// Extract default value {arg=default}
		if (name.includes('=')) {
			const [paramName, defaultValue] = name.split('=');
			name = paramName.trim();
			definition.default = defaultValue.trim();
			definition.required = false;

			// Handle special default values
			if (typeof definition.default === 'string' && !definition.default.length) {
				definition.default = null;
			} else if (definition.default === 'true') {
				definition.default = true;
				definition.type = 'boolean';
			} else if (definition.default === 'false') {
				definition.default = false;
				definition.type = 'boolean';
			}
		} else if (name.startsWith('--')) {
			// Boolean option without explicit default
			definition.required = false;
			definition.default = false;
			definition.type = 'boolean';
		}

		// Extract aliases {arg|a|alias}
		if (name.includes('|')) {
			const [paramName, ...aliases] = name.split('|');
			name = paramName.trim();
			definition.alias = aliases.map(a => a.trim());
		}

		// Detect if it's an option {--option}
		if (name.startsWith('--')) {
			isOption = true;
			name = name.slice(2);
		}

		// Handle variadic/array default {arg=*}
		if (definition.default === '*') {
			definition.default = [];
			definition.type = ['string'];
		}

		// Optional marker {arg?}
		if (name.endsWith('?')) {
			definition.required = false;
			name = name.slice(0, -1);
		}

		// Variadic marker {arg*}
		if (name.endsWith('*')) {
			definition.type = ['string'];
			definition.variadic = true;
			definition.default = [];
			name = name.slice(0, -1);
		}

		// Fallback to helper definitions for description
		definition.description = definition.description ?? helperDefinitions[name] ?? helperDefinitions[`--${name}`];

		return { name, isOption, definition };
	}
}
