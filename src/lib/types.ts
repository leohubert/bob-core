export type OptionPrimitive = 'secret' | 'string' | 'number' | 'boolean' | ['string'] | ['number'];
export type OptionDefinition = {
	type: OptionPrimitive
	description?: string
	alias?: string | Array<string>
	required?: boolean
	default?: any
	variadic?: boolean
}

export type Option = OptionPrimitive | OptionDefinition;

export type OptionType<O extends Option> =
	O extends 'secret' ? string :
		O extends 'string' ? string :
			O extends 'number' ? number :
				O extends 'boolean' ? boolean :
					O extends Array<'string'> ? Array<string> :
						O extends Array<'number'> ? Array<number> :
							O extends { type: infer T extends Option } ? OptionType<T> :
								never;

export type IsRequired<O extends Option> =
	O extends { required: true } ? true : false;

export type OptionReturnType<O extends Option> =
	IsRequired<O> extends true
		? OptionType<O>
		: OptionType<O> | null;

export type OptionsSchema = {
	[key: string]: Option;
}


export type OptionsObject<Options extends OptionsSchema> = {
	[Key in keyof Options]: OptionReturnType<Options[Key]>
}

export type ArgumentsSchema = {
	[key: string]: Option;
}

export type ArgumentsObject<Arguments extends ArgumentsSchema> = {
	[Key in keyof Arguments]: OptionReturnType<Arguments[Key]>
}
