import { describe, expect, expectTypeOf, it } from 'vitest';

import { Flags } from '@/src/flags/index.js';
import type { CustomFlagDef, FlagReturnType, FlagType } from '@/src/lib/types.js';

describe('Flags.custom()', () => {
	it('should return a factory function', () => {
		const dateFlag = Flags.custom<Date>({
			parse: (v: string) => new Date(v),
		});
		expect(typeof dateFlag).toBe('function');
	});

	it('should create a custom flag definition from factory', () => {
		const dateFlag = Flags.custom<Date>({
			parse: (v: string) => new Date(v),
		});
		const flag = dateFlag({ required: true, description: 'start date' });
		expect(flag.type).toBe('custom');
		expect(flag.required).toBe(true);
		expect(flag.description).toBe('start date');
		expect(typeof flag.parse).toBe('function');
	});

	it('should preserve parse function from factory', () => {
		const parse = (v: string) => new Date(v);
		const dateFlag = Flags.custom<Date>({ parse });
		const flag = dateFlag();
		expect(flag.parse).toBe(parse);
	});

	it('should allow defaults to be overridden', () => {
		const dateFlag = Flags.custom<Date>({
			parse: (v: string) => new Date(v),
			description: 'default desc',
		});
		const flag = dateFlag({ description: 'overridden desc' });
		expect(flag.description).toBe('overridden desc');
	});

	it('should have correct type', () => {
		const dateFlag = Flags.custom<Date>({
			parse: (v: string) => new Date(v),
		});
		const flag = dateFlag();
		expectTypeOf(flag).toMatchTypeOf<CustomFlagDef<Date>>();
	});

	it('should infer custom return type', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.custom<Date>({ parse: (v: string) => new Date(v) })();
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<Date>();
	});

	it('should infer custom with multiple as array', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.custom<Date>({ parse: (v: string) => new Date(v) })({ multiple: true });
		type Result = FlagType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<Date[]>();
	});

	it('should remove null from required custom flag', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const flag = Flags.custom<Date>({ parse: (v: string) => new Date(v) })({ required: true });
		type Result = FlagReturnType<typeof flag>;
		expectTypeOf<Result>().toEqualTypeOf<Date>();
	});
});
