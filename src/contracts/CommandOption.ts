import { Command } from '@/src/Command.js';
import { OptionDefinition } from '@/src/lib/types.js';

export interface CommandOption<Cmd extends Command> extends OptionDefinition {
	option: string;

	handler(this: Cmd): Promise<number | void>;
}
