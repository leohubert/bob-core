import { ValidationError } from '@/src/errors/ValidationError.js';
import { formatPromptMessage } from '@/src/flags/helpers.js';
import type { FlagDefinition, FlagOpts } from '@/src/lib/types.js';
import { isOptionFlag } from '@/src/shared/flagsUtils.js';

function buildSingleValidator(def: FlagDefinition, builderOpts: FlagOpts) {
	return (value: string) => {
		if ((value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) && def.required) {
			return 'This value is required';
		}
		try {
			def.parse(value, builderOpts);
		} catch (e) {
			if (e instanceof ValidationError) return e.message;
			throw e;
		}
		return true;
	};
}

function buildMultipleValidator(def: FlagDefinition, builderOpts: FlagOpts) {
	return (value: string) => {
		if ((value === null || value === undefined || value.trim() === '') && def.required) {
			return 'Please enter at least one value';
		}
		for (const raw of value.split(',')) {
			const trimmed = raw.trim();
			if (trimmed === '') continue;
			try {
				def.parse(trimmed, builderOpts);
			} catch (e) {
				if (e instanceof ValidationError) return `"${trimmed}": ${e.message}`;
				throw e;
			}
		}
		return true;
	};
}

export async function buildStringAsk(builderOpts: FlagOpts): Promise<any> {
	const def = builderOpts.definition;
	const isMultiple = def.multiple === true;
	const promptText = formatPromptMessage(builderOpts.name, def);

	if (isMultiple) {
		return await builderOpts.ux.askForList(promptText + 'Please provide one or more values, separated by commas:\n', {
			separator: ',',
			validate: buildMultipleValidator(def, builderOpts),
		});
	}

	if (def.secret) {
		return builderOpts.ux.askForPassword(promptText, {
			validate: buildSingleValidator(def, builderOpts),
		});
	}

	return await builderOpts.ux.askForInput(promptText, {
		validate: buildSingleValidator(def, builderOpts),
	});
}

export async function buildNumberAsk(builderOpts: FlagOpts): Promise<any> {
	const def = builderOpts.definition;
	const isMultiple = def.multiple === true;
	const promptText = formatPromptMessage(builderOpts.name, def);

	if (isMultiple) {
		return await builderOpts.ux.askForList(promptText + 'Please provide one or more values, separated by commas:\n', {
			separator: ',',
			validate: buildMultipleValidator(def, builderOpts),
		});
	}

	return await builderOpts.ux.askForNumber(promptText, {
		validate: (value: number | undefined) => {
			if (value === undefined && def.required) {
				return 'This value is required';
			}
			if (value !== undefined) {
				try {
					def.parse(String(value), builderOpts);
				} catch (e) {
					if (e instanceof ValidationError) return e.message;
					throw e;
				}
			}
			return true;
		},
	});
}

export async function buildOptionAsk(builderOpts: FlagOpts<any, any>): Promise<any> {
	const def = builderOpts.definition;
	const isMultiple = def.multiple === true;
	const promptText = formatPromptMessage(builderOpts.name, def);

	if (!isOptionFlag(def)) return null;
	const choices = def.options.map((o: string) => ({ name: o, value: o }));

	if (isMultiple) {
		return await builderOpts.ux.askForCheckbox(promptText, choices);
	}

	return await builderOpts.ux.askForSelect(promptText, choices);
}

export async function buildFileAsk(builderOpts: FlagOpts): Promise<any> {
	const promptText = formatPromptMessage(builderOpts.name, builderOpts.definition);
	return builderOpts.ux.askForFile(promptText, { basePath: process.cwd() });
}

export async function buildDirectoryAsk(builderOpts: FlagOpts): Promise<any> {
	const promptText = formatPromptMessage(builderOpts.name, builderOpts.definition);
	return builderOpts.ux.askForDirectory(promptText, { basePath: process.cwd() });
}

export async function buildUrlAsk(builderOpts: FlagOpts): Promise<any> {
	const promptText = formatPromptMessage(builderOpts.name, builderOpts.definition);
	return await builderOpts.ux.askForInput(promptText, {
		validate: buildSingleValidator(builderOpts.definition, builderOpts),
	});
}
