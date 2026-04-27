import { optionFlag } from '@/src/flags/option.js';
import { FlagDefinition } from '@/src/lib/types.js';

export function isOptionFlag(flag: FlagDefinition<any, any>): flag is ReturnType<typeof optionFlag> {
	return flag.type === 'option' && 'options' in flag;
}
