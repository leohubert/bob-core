export type SelectOption<Value = string> = {
	name: string;
	value: Value;
	disabled?: boolean | string;
	checked?: boolean;
	description?: string;
};

export type TableColumnAlignment = 'left' | 'right' | 'center';

export type TableColumn<T = Record<string, unknown>> = {
	key: keyof T & string;
	header?: string;
	width?: number;
	alignment?: TableColumnAlignment;
	format?: (value: unknown) => string;
};

export type ProgressBarOptions = {
	width?: number;
	completeChar?: string;
	incompleteChar?: string;
};

export type KeyValueOptions = {
	separator?: string;
	keyStyle?: (key: string) => string;
};
