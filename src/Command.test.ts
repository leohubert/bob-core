import {describe, it, expect, beforeEach, vi} from 'vitest';
import { Command } from '@/src/Command.js';
import {MissingRequiredArgumentValue} from "@/src/errors/MissingRequiredArgumentValue.js";
import {CommandIO} from "@/src/CommandIO.js";

class MockCommand extends Command {
    signature = 'mockCommand {argument} {--option}';
    description = 'This is a mock command for testing';

	protected get CommandIOClass(): typeof CommandIO {
		return vi.mockObject(CommandIO);
	}

	protected handle() {
        const opts = this.option('option');
        const arg = this.argument('argument');

        if (opts) {
            return Promise.resolve(11);
        }

        if (arg === 'value') {
            return Promise.resolve(1);
        } else if (arg) {
            return Promise.resolve(-1);
        }

        return Promise.resolve(0);
    }
}

describe('Command', () => {
    let command: MockCommand;

    beforeEach(() => {
        command = new MockCommand();
    });

    it('should have a command', () => {
        expect(command.command).toBe('mockCommand');
    });

    it('should have a signature', () => {
        expect(command.signature).toBe('mockCommand {argument} {--option}');
    });

    it('should have a description', () => {
        expect(command.description).toBe('This is a mock command for testing');
    });


    it('should handle command with argument', async () => {
        const result = await command.run(undefined, 'value')
        expect(result).toBe(1);
    });

    it('should handle command with argument', async () => {
        const result = await command.run(undefined, 'badValue')
        expect(result).toBe(-1);
    });

    it('should throw error if argument is missing', async () => {
        await expect(command.run(undefined)).rejects.toThrowError(MissingRequiredArgumentValue);

    });

    it('should handle command with option', async () => {
        const result = await command.run(undefined,  'value', '--option')
        expect(result).toBe(11);
    })
});