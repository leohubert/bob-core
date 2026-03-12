import chalk from 'chalk';

import { Command } from '@/src/Command.js';
import { Flags } from '@/src/Flags.js';
import { generateSpace } from '@/src/lib/string.js';
import { ContextDefinition, FlagDefinition } from '@/src/lib/types.js';

function getTypeDisplay(details: FlagDefinition): string {
	const type = details.type;
	if (Array.isArray(type)) return `[${type[0]}]`;
	if (type === 'enum' && details.options) return `enum: ${details.options.join('|')}`;
	return type;
}

export const HelpCommandFlag = Flags.boolean({
	alias: ['h'],
	handler: (value: boolean, ctx: ContextDefinition, cmd: typeof Command) => {
		if (!value) {
			return { shouldStop: false };
		}

		const argumentDefinitions = cmd.args;
		const flagDefinitions = cmd.flags;

		const availableArguments: [string, FlagDefinition][] = Object.entries(argumentDefinitions);
		const availableOptions: [string, FlagDefinition][] = Object.entries(flagDefinitions);

		const optionsWithAlias = availableOptions.map(([name, signature]) => {
			const aliases = Array.isArray(signature.alias) ? signature.alias : signature.alias ? [signature.alias] : [];
			return {
				name,
				...signature,
				optionWithAlias: `--${name}${aliases.map((a: string) => `, -${a}`).join('')}`,
			};
		});

		const requiredArguments = availableArguments.filter(([, signature]) => signature.required);

		console.log(chalk.yellow('Description:'));
		console.log(`  ${cmd.description}\n`);

		console.log(chalk.yellow('Usage:'));
		console.log(`  ${cmd.command} ${requiredArguments.length > 0 ? requiredArguments.map(([name]) => `<${name}>`).join(' ') : '\b'} [options]`);

		const maxOptionLength: number = Math.max(...optionsWithAlias.map(opt => opt.optionWithAlias.length), 0);
		const maxArgumentLength: number = Math.max(...availableArguments.map(([name]) => name.length), 0);
		const maxLength = maxArgumentLength > maxOptionLength ? maxArgumentLength : maxOptionLength;

		if (availableArguments.length > 0) {
			console.log(`\n${chalk.yellow('Arguments')}:`);

			for (const [name, definition] of availableArguments) {
				const spaces = generateSpace(maxLength - name.length);

				let message = `  ${chalk.green(name)} ${spaces} ${definition.description ?? '\b'}`;

				if (definition.default !== undefined && !definition.required) {
					const typeDisplay = getTypeDisplay(definition);
					const defaultValue = typeDisplay === 'array' || Array.isArray(definition.type) ? JSON.stringify(definition.default) : definition.default;

					message += ` ${chalk.yellow(`[default: ${defaultValue}]`)}`;
				}

				if ('multiple' in definition && definition.multiple) {
					message += ` ${chalk.white('(variadic)')}`;
				}

				console.log(message);
			}
		}

		if (availableOptions.length > 0) {
			console.log(`\n${chalk.yellow('Options')}:`);

			for (const signature of optionsWithAlias) {
				const spaces = generateSpace(maxLength - signature.optionWithAlias.length);

				let message = `${chalk.green(signature.optionWithAlias)} ${spaces} ${signature.description ?? '\b'}`;

				if (signature.type) {
					message += ` ${chalk.white(`(${getTypeDisplay(signature)})`)}`;
				}

				if (signature.default !== undefined && !signature.required) {
					const typeDisplay = getTypeDisplay(signature);
					const defaultValue = typeDisplay === 'array' || Array.isArray(signature.type) ? JSON.stringify(signature.default) : signature.default;
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
