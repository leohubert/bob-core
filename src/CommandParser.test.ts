import { CommandParser } from './CommandParser';
import {MissingRequiredArgumentValue} from "./errors/MissingRequiredArgumentValue";
import {CommandOption} from "./contracts/CommandOption";
import {Command} from "./Command";


class TestCommandOptions implements CommandOption<Command>{
    option = 'testOption';
    description = 'Test option';

    defaultValue: string|null = 'default';

    alias = ['t'];

    async handler() {
        return 0;
    }
}

describe('CommandParser', () => {
    let commandParser: CommandParser;

    const parseCommand = (signature: string, args: string[], helperDefinition: Record<string, string> = {}, defaultCommandOptions: CommandOption<any>[] = []) => {
        return new CommandParser(signature, helperDefinition, defaultCommandOptions , ...args);
    }

    it('should parse signature without arguments & options', () => {
        commandParser = parseCommand('test', []);
        expect(commandParser.command).toBe('test');
    })

    describe('Arguments', () => {

        it('should parse signature with arguments', () => {
            commandParser = parseCommand('test {arg1} {arg2}', ['value1', 'value2']);
            expect(commandParser.argument('arg1')).toBe('value1');
            expect(commandParser.argument('arg2')).toBe('value2');
        })

        it('should parse signature with optional arguments', () => {
            commandParser = parseCommand('test {arg1?} {arg2?}', ['value1']);
            expect(commandParser.argument('arg1')).toBe('value1');
            expect(commandParser.argument('arg2')).toBeNull();
        })

        it('should parse signature with optional arguments with default value', () => {
            commandParser = parseCommand('test {arg1?} {arg2=defaultValue1}', ['value1']);
            expect(commandParser.argument('arg1')).toBe('value1');
            expect(commandParser.argument('arg2')).toBe('defaultValue1');
        })

        it('should parse signature with variadic arguments', () => {
            commandParser = parseCommand('test {arg1*}', ['value1', 'value2']);
            expect(commandParser.argument('arg1')).toEqual(['value1', 'value2']);
        })

        it('should parse signature with optional variadic arguments', () => {
            commandParser = parseCommand('test {arg1*?}', ['value1', 'value2']);
            expect(commandParser.argument('arg1')).toEqual(['value1', 'value2']);
        })

        it('should parse signature with optional variadic arguments without value', () => {
            commandParser = parseCommand('test {arg1*?}', []);
            expect(commandParser.argument('arg1')).toEqual([]);
        })

        it('should set argument value', () => {
            commandParser = parseCommand('test {arg1}', ['value1']);
            commandParser.setArgument('arg1', 'newValue');
            expect(commandParser.argument('arg1')).toBe('newValue');
        })

        it('should throw error when argument is missing with setArgument', () => {
            commandParser = parseCommand('test {arg1}', []);
            expect(() => commandParser.setArgument('arg2', 'newValue')).toThrowError(Error);
        })

        it('calling validate method should throw error when argument is missing', () => {
            commandParser = parseCommand('test {arg1}', []);
            expect(() => commandParser.validate()).toThrowError(MissingRequiredArgumentValue);
        })

        it('calling validate should throw with variadic argument is missing', () => {
            commandParser = parseCommand('test {arg1*}', []);
            expect(() => commandParser.validate()).toThrowError(MissingRequiredArgumentValue);
        })
    })

    describe('Options', () => {

        it('boolean option should be false when not provided', () => {
            commandParser = parseCommand('test {--option}', []);
            expect(commandParser.option('option')).toBeFalsy()
        })

        it('boolean option should be true when provided', () => {
            commandParser = parseCommand('test {--option}', ['--option']);
            expect(commandParser.option('option')).toBeTruthy()
        })

        it('boolean option should be true when provided with value', () => {
            commandParser = parseCommand('test {--option}', ['--option=true']);
            expect(commandParser.option('option')).toBeTruthy()
        })

        it('boolean option should be false when provided with value', () => {
            commandParser = parseCommand('test {--option}', ['--option=false']);
            expect(commandParser.option('option')).toBeFalsy()
        })

        it('string option should be null when not provided', () => {
            commandParser = parseCommand('test {--option=}', []);
            expect(commandParser.option('option')).toBeNull()
        })

        it('string option should be value when provided', () => {
            commandParser = parseCommand('test {--option=}', ['--option=value']);
            expect(commandParser.option('option')).toBe('value')
        })

        it('string option should take the default value when not provided', () => {
            commandParser = parseCommand('test {--option=default}', []);
            expect(commandParser.option('option')).toBe('default')
        })

        it('string option should take the provided value with default value', () => {
            commandParser = parseCommand('test {--option=default}', ['--option=value']);
            expect(commandParser.option('option')).toBe('value')
        })

        it('array option should be empty when not provided', () => {
            commandParser = parseCommand('test {--option=*}', []);
            expect(commandParser.option('option')).toEqual([])
        })

        it('array option should be value when provided', () => {
            commandParser = parseCommand('test {--option=*}', ['--option=value1', '--option=value2']);
            expect(commandParser.option('option')).toEqual(['value1', 'value2'])
        })
    })

    describe('Mixed', () => {
        it('should parse signature with arguments and options', () => {
            commandParser = parseCommand('test {arg1} {arg2} {--option}', ['value1', 'value2', '--option']);
            expect(commandParser.argument('arg1')).toBe('value1');
            expect(commandParser.argument('arg2')).toBe('value2');
            expect(commandParser.option('option')).toBeTruthy()
        })

        it('should parse signature with optional arguments and options', () => {
            commandParser = parseCommand('test {arg1?} {arg2?} {--option}', ['value1', '--option']);
            expect(commandParser.argument('arg1')).toBe('value1');
            expect(commandParser.argument('arg2')).toBeNull();
            expect(commandParser.option('option')).toBeTruthy()
        })
    })

    describe('Helper', () => {
        it('should parse help signature', () => {
            commandParser = parseCommand('test {arg1} {arg2:help 1} {--option : option help 2 }', ['value1', 'value2', '--option']);
            expect(commandParser.argumentHelp('arg1')).toBeUndefined()
            expect(commandParser.argumentHelp('arg2')).toBe('help 1')
            expect(commandParser.optionHelp('option')).toBe('option help 2')
        })

        it('should define help with helperDefinition', () => {
            commandParser = parseCommand('test {arg1} {arg2} {--option} {--option2}', ['value1', 'value2', '--option'], {
                arg1: 'arg1 help',
                arg2: 'arg2 help',
                '--option': 'option help'
            });
            expect(commandParser.argumentHelp('arg1')).toBe('arg1 help')
            expect(commandParser.argumentHelp('arg2')).toBe('arg2 help')
            expect(commandParser.optionHelp('option')).toBe('option help')
            expect(commandParser.optionHelp('option2')).toBeUndefined()
        })


        it('should define help with helperDefinition with default value', () => {
            commandParser = parseCommand('test {arg1:arg1 help} {arg2} {--option=default}', ['value1', 'value2'], {
                arg2: 'arg2 help',
                '--option': 'option help'
            });
            expect(commandParser.argumentHelp('arg1')).toBe('arg1 help')
            expect(commandParser.argumentHelp('arg2')).toBe('arg2 help')
            expect(commandParser.optionHelp('option')).toBe('option help')
        })

    })

    describe('DefaultCommandOptions', () => {

        it('should parse default command options', () => {
            commandParser = parseCommand('test', [], {}, [new TestCommandOptions()]);
            expect(commandParser.option('testOption')).toBe('default');
        })

        it('should parse default command options with provided value', () => {
            commandParser = parseCommand('test', ['--testOption=value'], {}, [new TestCommandOptions()]);
            expect(commandParser.option('testOption')).toBe('value');
        })

        it('should parse default command options with provided value with alias', () => {
            commandParser = parseCommand('test', ['-t=value'], {}, [new TestCommandOptions()]);
            expect(commandParser.option('testOption')).toBe('value');
        })

        it('should parse default command option help', () => {
            commandParser = parseCommand('test', [], {}, [new TestCommandOptions()]);
            expect(commandParser.optionHelp('testOption')).toBe('Test option');
        })

        it('should handle null default value', () => {
            const option = new TestCommandOptions();
            option.defaultValue = null
            commandParser = parseCommand('test', ['--testOption=value'], {}, [option]);
            expect(commandParser.option('testOption')).toBe('value');
        })
    });
});