import { Option, OptionDefinition, OptionReturnType } from '@/src/lib/types.js';

export function getOptionPrimitiveDefaultValue<Opts extends Option>(type: Opts): OptionReturnType<Opts> {
	if (type === 'string') return null as OptionReturnType<Opts>;
	if (type === 'number') return null as OptionReturnType<Opts>;
	if (type === 'boolean') return false as OptionReturnType<Opts>;
	if (Array.isArray(type) && type.length === 1) {
		if (type[0] === 'string') return [] as unknown as OptionReturnType<Opts>;
		if (type[0] === 'number') return [] as unknown as OptionReturnType<Opts>;
	}
	throw new Error('Invalid option type: ' + type);
}

export function getOptionDefaultValue<Opts extends Option>(option: Opts): OptionReturnType<Opts> | null {
	if (typeof option === 'string' || Array.isArray(option)) {
		return getOptionPrimitiveDefaultValue(option) as OptionReturnType<Opts>;
	}

	if (option.default !== undefined) {
		return option.default as OptionReturnType<Opts>;
	}

	return getOptionPrimitiveDefaultValue(option.type) as OptionReturnType<Opts>;
}

export type OptionDetails = Required<OptionDefinition>;

export function getOptionDetails(option: Option): OptionDetails {
	if (typeof option === 'string' || Array.isArray(option)) {
		return {
			alias: [],
			default: getOptionDefaultValue(option),
			description: '',
			required: false,
			secret: false,
			type: option,
			variadic: false,
		};
	}

	return {
		alias: option.alias ? (Array.isArray(option.alias) ? option.alias : [option.alias]) : [],
		default: option.default ?? getOptionDefaultValue(option.type),
		description: option.description ?? '',
		required: option.required ?? false,
		secret: option.secret ?? false,
		type: option.type,
		variadic: option.variadic ?? false,
	};
}
