import { number as numberPrompt } from '@inquirer/prompts';

import { withCancelHandling } from '@/src/ux/helpers.js';

export type AskForNumberOptions = {
	default?: number;
	required?: boolean;
	min?: number;
	max?: number;
	step?: number | 'any';
	validate?: (value: number | undefined) => boolean | string | Promise<string | boolean>;
};

export async function askForNumber(message: string, opts?: AskForNumberOptions): Promise<number | null> {
	return withCancelHandling(async () => {
		const result = await numberPrompt({
			message,
			default: opts?.default,
			required: opts?.required,
			min: opts?.min,
			max: opts?.max,
			step: opts?.step,
			validate: opts?.validate,
		});
		return result ?? null;
	}, null);
}
