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

/**
 * Interactive prompts and structured-output helpers exposed to commands as
 * `this.ux`.
 *
 * **Cancellation contract:** every `askFor*` method returns `Promise<T | null>`,
 * where `null` means the user cancelled the prompt (Ctrl+C / SIGINT). Callers
 * should treat `null` as "user wants out" and react accordingly — there is no
 * separate "cancelled" exception to catch.
 */
export class UX {
	/** Yes/no confirmation. Returns `null` on cancel. */
	askForConfirmation(message?: string, opts?: AskForConfirmationOptions): Promise<boolean | null> {
		return askForConfirmation(message, opts);
	}

	/** Free-text input. Returns `null` on cancel. */
	askForInput(message: string, opts?: AskForInputOptions): Promise<string | null> {
		return askForInput(message, opts);
	}

	/** Masked password input. Returns `null` on cancel. */
	askForPassword(message: string, opts?: AskForPasswordOptions): Promise<string | null> {
		return askForPassword(message, opts);
	}

	/** Numeric input with optional validator. Returns `null` on cancel. */
	askForNumber(message: string, opts?: AskForNumberOptions): Promise<number | null> {
		return askForNumber(message, opts);
	}

	/** Single-choice list. Returns `null` on cancel. */
	askForSelect<V = string>(message: string, choices: Array<string | SelectOption<V>>, opts?: AskForSelectOptions<V>): Promise<V | null> {
		return askForSelect(message, choices, opts);
	}

	/** Multi-choice checkbox list. Returns `null` on cancel. */
	askForCheckbox<V = string>(message: string, choices: Array<string | SelectOption<V>>, opts?: AskForCheckboxOptions<V>): Promise<V[] | null> {
		return askForCheckbox(message, choices, opts);
	}

	/** Type-ahead search backed by a custom source. Returns `null` on cancel. */
	askForSearch<V = string>(message: string, source: SearchSource<V>, opts?: AskForSearchOptions<V>): Promise<V | null> {
		return askForSearch(message, source, opts);
	}

	/** Comma-separated list input. Returns `null` on cancel. */
	askForList(message: string, opts?: AskForListOptions): Promise<string[] | null> {
		return askForList(message, opts);
	}

	/** Two-state toggle with custom labels. Returns `null` on cancel. */
	askForToggle(message: string, opts?: AskForToggleOptions): Promise<boolean | null> {
		return askForToggle(message, opts);
	}

	/** Opens the user's editor (`$EDITOR`). Returns `null` on cancel. */
	askForEditor(message: string, opts?: AskForEditorOptions): Promise<string | null> {
		return askForEditor(message, opts);
	}

	/** Numbered list with manual entry. Returns `null` on cancel. */
	askForRawList<V = string>(message: string, choices: Array<{ key?: string; name?: string; value: V }>, opts?: AskForRawListOptions): Promise<V | null> {
		return askForRawList(message, choices, opts);
	}

	/** Single-key expand prompt (Yes/No/Help-style). Returns `null` on cancel. */
	askForExpand<V = string>(message: string, choices: Array<{ key: ExpandKey; name: string; value: V }>, opts?: AskForExpandOptions): Promise<V | null> {
		return askForExpand(message, choices, opts);
	}

	/** Filesystem file picker. Returns `null` on cancel. */
	askForFile(message: string, opts?: Omit<AskForFileSelectorOptions, 'type'>): Promise<string | null> {
		return askForFileSelector(message, { ...opts, type: 'file' });
	}

	/** Filesystem directory picker. Returns `null` on cancel. */
	askForDirectory(message: string, opts?: Omit<AskForFileSelectorOptions, 'type'>): Promise<string | null> {
		return askForFileSelector(message, { ...opts, type: 'directory' });
	}

	/** Generic file/directory picker. Returns `null` on cancel. */
	askForFileSelector(message: string, opts?: AskForFileSelectorOptions): Promise<string | null> {
		return askForFileSelector(message, opts);
	}

	/** Renders a key/value list to the terminal. */
	keyValue(pairs: Record<string, unknown> | Array<[string, unknown]>, opts?: KeyValueOptions): void {
		return keyValue(pairs, opts);
	}

	/** Renders rows as an aligned table with optional column metadata. */
	table<T extends Record<string, unknown>>(data: T[], columns?: TableColumn<T>[]): void {
		return table(data, columns);
	}

	/** Builds a progress bar bound to a known total. */
	newProgressBar(total: number, opts?: ProgressBarOptions) {
		return newProgressBar(total, opts);
	}

	/** Builds a spinner-style loader. */
	newLoader(text?: string, chars?: string[], delay?: number) {
		return newLoader(text, chars, delay);
	}
}

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
