import chalk from 'chalk';

import { normalizeAliases } from '@/src/flags/helpers.js';
import { Flags } from '@/src/flags/index.js';
import { generateSpace } from '@/src/lib/string.js';
import { FlagDefinition, ParameterOpts } from '@/src/lib/types.js';

function getTypeDisplay(details: FlagDefinition): string {
	const type = details.type;
	if (type === 'option' && 'options' in details && (details as any).options) return `enum: ${(details as any).options.join('|')}`;
	return type ?? 'custom';
}

export const HelpCommandFlag = Flags.boolean({
	alias: ['h'],
	description: 'Displays help information about the command',
	handler: (value: boolean, opts: ParameterOpts) => {
		if (!value) {
			return { shouldStop: false };
		}

		const cmd = opts.cmd;
		const argumentDefinitions = cmd.args;
		const flagDefinitions = { ...cmd.baseFlags, ...cmd.flags };

		const availableArguments: [string, FlagDefinition][] = Object.entries(argumentDefinitions);
		const availableFlags: [string, FlagDefinition][] = Object.entries(flagDefinitions);

		const flagsWithAlias = availableFlags.map(([name, definition]) => {
			const aliases = normalizeAliases(definition.alias);
			return {
				name,
				...definition,
				flagWithAlias: `--${name}${aliases.map(a => `, -${a}`).join('')}`,
			};
		});

		const requiredArguments = availableArguments.filter(([, signature]) => signature.required);

		console.log(chalk.yellow('Description:'));
		console.log(`  ${cmd.description}\n`);

		if (cmd.aliases.length > 0) {
			console.log(chalk.yellow('Aliases:'));
			console.log(`  ${cmd.aliases.join(', ')}\n`);
		}

		console.log(chalk.yellow('Usage:'));
		console.log(`  ${cmd.command} ${requiredArguments.length > 0 ? requiredArguments.map(([name]) => `<${name}>`).join(' ') : '\b'} [options]`);

		const maxOptionLength: number = Math.max(...flagsWithAlias.map(opt => opt.flagWithAlias.length), 0);
		const maxArgumentLength: number = Math.max(...availableArguments.map(([name]) => name.length), 0);
		const maxLength = maxArgumentLength > maxOptionLength ? maxArgumentLength : maxOptionLength;

		if (availableArguments.length > 0) {
			console.log(`\n${chalk.yellow('Arguments')}:`);

			for (const [name, definition] of availableArguments) {
				const spaces = generateSpace(maxLength - name.length);

				let message = `  ${chalk.green(name)} ${spaces} ${definition.description ?? '\b'}`;

				if (definition.default !== undefined && !definition.required) {
					const defaultValue =
						typeof definition.default === 'function' ? '[function]' : definition.multiple ? JSON.stringify(definition.default) : definition.default;

					message += ` ${chalk.yellow(`[default: ${defaultValue}]`)}`;
				}

				if ('multiple' in definition && definition.multiple) {
					message += ` ${chalk.white('(variadic)')}`;
				}

				console.log(message);
			}
		}

		if (availableFlags.length > 0) {
			console.log(`\n${chalk.yellow('Options')}:`);

			for (const definition of flagsWithAlias) {
				const spaces = generateSpace(maxLength - definition.flagWithAlias.length);

				let message = `  ${chalk.green(definition.flagWithAlias)} ${spaces} ${definition.description ?? '\b'}`;

				if (definition.type) {
					message += ` ${chalk.white(`(${getTypeDisplay(definition)})`)}`;
				}

				if (definition.default !== undefined && !definition.required) {
					const defaultValue = typeof definition.default === 'function' ? '(function)' : definition.default;
					message += ` ${chalk.yellow(`[default: ${defaultValue}]`)}`;
				}

				console.log(message);
			}
		}

		const examples = cmd.examples ?? [];
		if (examples.length > 0) {
			console.log(`\n${chalk.yellow('Examples')}:`);
			let binaryName = process.argv[0].split('/').pop();
			if (binaryName === 'node') {
				binaryName += ' ' + process.argv[1].split('/').pop();
			}

			for (const [index, example] of examples.entries()) {
				if (index > 0) {
					console.log('');
				}
				console.log(`  ${example.description}\n`);
				console.log(`    ${chalk.green(`${binaryName} ${example.command}`)}`);
			}
		}

		return { shouldStop: true };
	},
});
