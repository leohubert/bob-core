import { type AskForCheckboxOptions, askForCheckbox } from '@/src/ux/askForCheckbox.js';
import { type AskForConfirmationOptions, askForConfirmation } from '@/src/ux/askForConfirmation.js';
import { type AskForEditorOptions, askForEditor } from '@/src/ux/askForEditor.js';
import { type AskForExpandOptions, type ExpandKey, askForExpand } from '@/src/ux/askForExpand.js';
import { type AskForFileSelectorOptions, askForFileSelector } from '@/src/ux/askForFileSelector.js';
import { type AskForInputOptions, askForInput } from '@/src/ux/askForInput.js';
import { type AskForListOptions, askForList } from '@/src/ux/askForList.js';
import { type AskForNumberOptions, askForNumber } from '@/src/ux/askForNumber.js';
import { type AskForPasswordOptions, askForPassword } from '@/src/ux/askForPassword.js';
import { type AskForRawListOptions, askForRawList } from '@/src/ux/askForRawList.js';
import { type AskForSearchOptions, type SearchSource, askForSearch } from '@/src/ux/askForSearch.js';
import { type AskForSelectOptions, askForSelect } from '@/src/ux/askForSelect.js';
import { type AskForToggleOptions, askForToggle } from '@/src/ux/askForToggle.js';
import { keyValue } from '@/src/ux/keyValue.js';
import { newLoader } from '@/src/ux/loader.js';
import { newProgressBar } from '@/src/ux/progressBar.js';
import { table } from '@/src/ux/table.js';
import type { KeyValueOptions, ProgressBarOptions, SelectOption, TableColumn } from '@/src/ux/types.js';

export class UX {
	askForConfirmation(message?: string, opts?: AskForConfirmationOptions): Promise<boolean> {
		return askForConfirmation(message, opts);
	}

	askForInput(message: string, opts?: AskForInputOptions): Promise<string | null> {
		return askForInput(message, opts);
	}

	askForPassword(message: string, opts?: AskForPasswordOptions): Promise<string | null> {
		return askForPassword(message, opts);
	}

	askForNumber(message: string, opts?: AskForNumberOptions): Promise<number | null> {
		return askForNumber(message, opts);
	}

	askForSelect<V = string>(message: string, choices: Array<string | SelectOption<V>>, opts?: AskForSelectOptions<V>): Promise<V | null> {
		return askForSelect(message, choices, opts);
	}

	askForCheckbox<V = string>(message: string, choices: Array<string | SelectOption<V>>, opts?: AskForCheckboxOptions<V>): Promise<V[] | null> {
		return askForCheckbox(message, choices, opts);
	}

	askForSearch<V = string>(message: string, source: SearchSource<V>, opts?: AskForSearchOptions<V>): Promise<V | null> {
		return askForSearch(message, source, opts);
	}

	askForList(message: string, opts?: AskForListOptions): Promise<string[] | null> {
		return askForList(message, opts);
	}

	askForToggle(message: string, opts?: AskForToggleOptions): Promise<boolean> {
		return askForToggle(message, opts);
	}

	askForEditor(message: string, opts?: AskForEditorOptions): Promise<string | null> {
		return askForEditor(message, opts);
	}

	askForRawList<V = string>(message: string, choices: Array<{ key?: string; name?: string; value: V }>, opts?: AskForRawListOptions): Promise<V | null> {
		return askForRawList(message, choices, opts);
	}

	askForExpand<V = string>(message: string, choices: Array<{ key: ExpandKey; name: string; value: V }>, opts?: AskForExpandOptions): Promise<V | null> {
		return askForExpand(message, choices, opts);
	}

	askForFile(message: string, opts?: Omit<AskForFileSelectorOptions, 'type'>): Promise<string | null> {
		return askForFileSelector(message, { ...opts, type: 'file' });
	}

	askForDirectory(message: string, opts?: Omit<AskForFileSelectorOptions, 'type'>): Promise<string | null> {
		return askForFileSelector(message, { ...opts, type: 'directory' });
	}

	askForFileSelector(message: string, opts?: AskForFileSelectorOptions): Promise<string | null> {
		return askForFileSelector(message, opts);
	}

	keyValue(pairs: Record<string, unknown> | Array<[string, unknown]>, opts?: KeyValueOptions): void {
		return keyValue(pairs, opts);
	}

	table<T extends Record<string, unknown>>(data: T[], columns?: TableColumn<T>[]): void {
		return table(data, columns);
	}

	newProgressBar(total: number, opts?: ProgressBarOptions) {
		return newProgressBar(total, opts);
	}

	newLoader(text?: string, chars?: string[], delay?: number) {
		return newLoader(text, chars, delay);
	}
}

// Re-export standalone functions and types
export { askForCheckbox } from '@/src/ux/askForCheckbox.js';
export { askForConfirmation } from '@/src/ux/askForConfirmation.js';
export { askForEditor } from '@/src/ux/askForEditor.js';
export { askForExpand } from '@/src/ux/askForExpand.js';
export { askForFileSelector } from '@/src/ux/askForFileSelector.js';
export { askForInput } from '@/src/ux/askForInput.js';
export { askForList } from '@/src/ux/askForList.js';
export { askForNumber } from '@/src/ux/askForNumber.js';
export { askForPassword } from '@/src/ux/askForPassword.js';
export { askForRawList } from '@/src/ux/askForRawList.js';
export { askForSearch } from '@/src/ux/askForSearch.js';
export { askForSelect } from '@/src/ux/askForSelect.js';
export { askForToggle } from '@/src/ux/askForToggle.js';
export { keyValue } from '@/src/ux/keyValue.js';
export { newLoader } from '@/src/ux/loader.js';
export { newProgressBar } from '@/src/ux/progressBar.js';
export { table } from '@/src/ux/table.js';
export { withCancelHandling } from '@/src/ux/helpers.js';
export type { SelectOption, TableColumn, TableColumnAlignment, ProgressBarOptions, KeyValueOptions } from '@/src/ux/types.js';
export type { AskForConfirmationOptions } from '@/src/ux/askForConfirmation.js';
export type { AskForInputOptions } from '@/src/ux/askForInput.js';
export type { AskForPasswordOptions } from '@/src/ux/askForPassword.js';
export type { AskForNumberOptions } from '@/src/ux/askForNumber.js';
export type { AskForSelectOptions } from '@/src/ux/askForSelect.js';
export type { AskForCheckboxOptions } from '@/src/ux/askForCheckbox.js';
export type { AskForSearchOptions, SearchSource } from '@/src/ux/askForSearch.js';
export type { AskForListOptions } from '@/src/ux/askForList.js';
export type { AskForToggleOptions } from '@/src/ux/askForToggle.js';
export type { AskForEditorOptions } from '@/src/ux/askForEditor.js';
export type { AskForRawListOptions } from '@/src/ux/askForRawList.js';
export type { AskForExpandOptions, ExpandKey } from '@/src/ux/askForExpand.js';
export type { AskForFileSelectorOptions } from '@/src/ux/askForFileSelector.js';
