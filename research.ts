type RequiredOrDefaulted<U extends FlagProps<any>> = U extends { required: true } ? true : U extends { default: any } ? true : false;

type FlagReturnType<T, U extends FlagProps<T>> =
	RequiredOrDefaulted<U> extends true
		? U['multiple'] extends true
			? [T] extends [Array<unknown>]
				? T
				: T[]
			: T
		: U['multiple'] extends true
			? [T] extends [Array<unknown>]
				? T | null
				: T[] | null
			: T | null;

type FlagProps<T> = {
	parse?: (input: any) => T | null;
	default?: T | T[] | null | (() => Promise<T | T[] | null>);
	required?: boolean;
	multiple?: boolean;
	[key: string]: any;
};

type CustomOptions = Record<string, unknown>;

type FlagDefinition<T, U extends FlagProps<T>, C extends CustomOptions> = FlagProps<T> & U & C;

type FlagDefinitionReturnType<D> = D extends FlagProps<infer T> ? FlagReturnType<T, D & FlagProps<T>> : never;

function custom<T = string, C extends CustomOptions = CustomOptions>(defaults: FlagProps<T>) {
	return <const U extends FlagProps<T>>(overrides?: U & C) => {
		return {
			...defaults,
			...overrides,
		} as FlagDefinition<T, U, C>;
	};
}

const stringFlag = custom({
	parse: (input: any) => String(input),
});
const numberFlag = custom<number, { min?: number }>({
	parse: (input: any) => Number(input),
});
const dateFlag = custom<Date, { min?: Date }>({
	parse: (input: any) => new Date(input),
});

const optionsFlag = <O extends readonly string[]>(opts: { options: O }) =>
	custom<O[number], { options: O }>({
		parse: (input: string) =>
			opts.options.includes(input)
				? input
				: (() => {
						throw new Error(`Invalid option: ${input}`);
					})(),
	})(opts);

type ParsedFlags<T extends Record<string, FlagDefinition<any, any, any>>> = {
	[Key in keyof T]: FlagDefinitionReturnType<T[Key]>;
};

enum FormatType {
	CSV = 'csv',
	JSON = 'json',
}

const _flags = {
	test: stringFlag({ required: true, multiple: true }),
	optional: stringFlag({}),
	number: numberFlag({ default: 23, min: 2 }),
	date: dateFlag({ required: true }),
	options: optionsFlag({
		options: Object.keys(optionsFlag) as FormatType[],
	}),
};

type _flags = ParsedFlags<typeof _flags>;
const flags = {} as _flags;

const _date = flags.date;

type _flagString = FlagReturnType<string, typeof _flags.test>;
type _flagNumber = FlagReturnType<number, typeof _flags.number>;
type _flagOptional = FlagReturnType<string, typeof _flags.optional>;
type _flagDate = FlagReturnType<Date, typeof _flags.date>;
type _flagOption = FlagReturnType<FormatType, typeof _flags.options>;
