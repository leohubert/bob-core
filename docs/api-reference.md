# API Reference

Complete API documentation for BOB Core.

## Cli Class

Main CLI orchestrator.

### Constructor

```typescript
new Cli<C = any>(options?: CliOptions<C>)
```

**Options:**
```typescript
interface CliOptions<C> {
  ctx?: C;                    // Context to inject into commands
  name?: string;              // CLI name for help display
  version?: string;           // CLI version for help display
  logger?: Logger;            // Custom logger instance
}
```

### Methods

#### withCommands()

Load commands from various sources.

```typescript
async withCommands(
  ...commands: Array<Command | { new(): Command } | string>
): Promise<void>
```

**Examples:**
```typescript
// Load from directory
await cli.withCommands('./commands');

// Register class
await cli.withCommands(MyCommand);

// Register instance
await cli.withCommands(new MyCommand());

// Mix and match
await cli.withCommands('./commands', MyCommand, new OtherCommand());
```

#### runCommand()

Execute a command.

```typescript
async runCommand(
  command: string | Command | undefined,
  ...args: any[]
): Promise<number>
```

**Returns:** Exit code (0 for success, non-zero for errors)

**Examples:**
```typescript
// Run by name
const code = await cli.runCommand('deploy', 'prod', '--force');

// Run command instance
const code = await cli.runCommand(myCommand, 'arg1');

// Show help if no command
const code = await cli.runCommand(undefined);
```

#### runHelpCommand()

Display help.

```typescript
async runHelpCommand(): Promise<number>
```

#### withCommandResolver()

Set custom command resolver.

```typescript
withCommandResolver(resolver: CommandResolver): Cli
```

#### withFileImporter()

Set custom file importer.

```typescript
withFileImporter(importer: FileImporter): Cli
```

### Properties

```typescript
cli.commandRegistry: CommandRegistry  // Access to command registry
```

---

## Command Class

Modern schema-based command.

### Constructor

```typescript
new Command<C, Options, Arguments>(
  command: string,
  options?: {
    description?: string;
    group?: string;
    options?: Options;
    arguments?: Arguments;
  }
)
```

### Methods

#### handler()

Set the command handler.

```typescript
handler(
  handler: (ctx: C, opts: {
    options: OptionsObject<Options>,
    arguments: ArgumentsObject<Arguments>
  }) => Promise<number | void> | number | void
): Command
```

#### preHandler()

Set a pre-handler (runs before main handler).

```typescript
preHandler(
  handler: (ctx: C, opts: {
    options: OptionsObject<Options>,
    arguments: ArgumentsObject<Arguments>
  }) => Promise<number | void> | number | void
): Command
```

#### options()

Add options schema.

```typescript
options<Opts>(opts: Opts): Command<C, Options & Opts, Arguments>
```

#### arguments()

Add arguments schema.

```typescript
arguments<Args>(args: Args): Command<C, Options, Arguments & Args>
```

#### disablePrompting()

Disable interactive prompts.

```typescript
disablePrompting(): Command
```

#### run()

Execute the command.

```typescript
async run(opts: {
  ctx: C;
  logger: Logger;
  args: string[];
} | {
  ctx: C;
  logger: Logger;
  options: OptionsObject<Options>;
  arguments: ArgumentsObject<Arguments>;
}): Promise<number | void>
```

### Properties

```typescript
command.command: string        // Command name
command.description: string    // Command description
command.group?: string        // Command group
```

---

## CommandWithSignature Class

Legacy signature-based command.

### Abstract Properties

```typescript
abstract signature: string      // Command signature
abstract description: string    // Command description
```

### Properties

```typescript
helperDefinitions: { [key: string]: string }  // Help text
commandsExamples: CommandExample[]            // Usage examples
```

### Abstract Methods

```typescript
protected abstract handle(
  ctx: C,
  opts: CommandHandlerOptions<Options, Arguments>
): Promise<number | void>
```

### Helper Methods

#### argument()

Get argument value.

```typescript
protected argument<T = string>(key: string): T | null
protected argument<T = string>(key: string, defaultValue: T): T
```

#### option()

Get option value.

```typescript
protected option<T = string>(key: string): T | null
protected option<T = string>(key: string, defaultValue: T): T
```

#### askForConfirmation()

Prompt for confirmation.

```typescript
protected async askForConfirmation(
  message?: string,
  defaultValue?: boolean
): Promise<boolean>
```

#### askForInput()

Prompt for input.

```typescript
protected async askForInput(
  message: string,
  defaultValue?: string | number,
  opts?: {
    type?: 'text' | 'password' | 'number';
    validate?: (value: string) => boolean | string;
    min?: number;
    max?: number;
  }
): Promise<string | null>
```

#### askForSelect()

Prompt for selection.

```typescript
protected async askForSelect(
  message: string,
  options: Array<string | SelectOption>,
  opts?: {
    type?: 'select' | 'multiselect' | 'autocomplete' | 'autocompleteMultiselect';
    initial?: number;
    validate?: (value: string) => boolean;
    suggest?: (input: string, choices: SelectOption[]) => Promise<SelectOption[]>;
  }
): Promise<string | null>
```

#### newLoader()

Create a loader/spinner.

```typescript
protected newLoader(
  text?: string,
  chars?: string[],
  delay?: number
): {
  updateText(text: string): void;
  stop(): void;
  [Symbol.dispose](): void;
}
```

### Protected Properties

```typescript
protected ctx: C              // Context
protected io: CommandIO       // I/O utilities
protected logger: Logger      // Logger
protected parser: CommandSignatureParser  // Parser
```

---

## CommandIO Class

Interactive I/O utilities.

### Methods

#### Logging

```typescript
log(...args: any[]): void
info(...args: any[]): void
warn(...args: any[]): void
error(...args: any[]): void
debug(...args: any[]): void
```

#### askForConfirmation()

```typescript
async askForConfirmation(
  message?: string,
  defaultValue?: boolean
): Promise<boolean>
```

#### askForInput()

```typescript
async askForInput(
  message: string,
  defaultValue?: string | number,
  opts?: {
    type?: 'text' | 'password' | 'number';
    validate?: (value: string) => boolean | string;
    min?: number;
    max?: number;
  }
): Promise<string | null>
```

#### askForSelect()

```typescript
async askForSelect(
  message: string,
  options: Array<string | SelectOption>,
  opts?: {
    type?: 'select' | 'multiselect' | 'autocomplete' | 'autocompleteMultiselect';
    initial?: number;
    validate?: (value: string) => boolean;
    suggest?: (input: string, choices: SelectOption[]) => Promise<SelectOption[]>;
  }
): Promise<string | null>
```

#### askForList()

```typescript
async askForList(
  message: string,
  defaultValue?: string | number,
  opts?: {
    validate?: (value: string[]) => boolean | string;
    format?: (value: string) => string;
    separator?: string;
  }
): Promise<string[] | null>
```

#### askForDate()

```typescript
async askForDate(
  message: string,
  defaultValue?: Date,
  opts?: {
    validate?: (value: Date) => boolean | string;
    mask?: string;
  }
): Promise<Date | null>
```

#### askForToggle()

```typescript
async askForToggle(
  message: string,
  defaultValue?: boolean,
  opts?: {
    active?: string;
    inactive?: string;
  }
): Promise<boolean>
```

#### newLoader()

```typescript
newLoader(
  text?: string,
  chars?: string[],
  delay?: number
): {
  updateText(text: string): void;
  stop(): void;
  [Symbol.dispose](): void;
  [Symbol.asyncDispose](): void;
}
```

---

## CommandRegistry Class

Manages command registration and discovery.

### Methods

#### registerCommand()

```typescript
registerCommand(command: Command, force?: boolean): void
```

#### loadCommandsPath()

```typescript
async loadCommandsPath(commandsPath: string): Promise<void>
```

#### runCommand()

```typescript
async runCommand(
  ctx: any,
  command: string | Command,
  ...args: any[]
): Promise<number>
```

#### getAvailableCommands()

```typescript
getAvailableCommands(): string[]
```

#### getCommands()

```typescript
getCommands(): Array<Command>
```

#### withCommandResolver()

```typescript
withCommandResolver(resolver: CommandResolver): CommandRegistry
```

#### withFileImporter()

```typescript
withFileImporter(importer: FileImporter): CommandRegistry
```

---

## Type Definitions

### OptionPrimitive

```typescript
type OptionPrimitive =
  | 'string'
  | 'number'
  | 'boolean'
  | 'secret'
  | ['string']
  | ['number']
```

### OptionDefinition

```typescript
interface OptionDefinition {
  type: OptionPrimitive;
  description?: string;
  alias?: string | string[];
  required?: boolean;
  default?: any;
  variadic?: boolean;
}
```

### OptionsSchema

```typescript
interface OptionsSchema {
  [key: string]: OptionPrimitive | OptionDefinition;
}
```

### SelectOption

```typescript
interface SelectOption {
  title: string;
  value?: any;
  disabled?: boolean;
  selected?: boolean;
  description?: string;
}
```

### CommandExample

```typescript
interface CommandExample {
  description: string;
  command: string;
}
```

---

## Error Classes

### BobError

Base error class.

```typescript
class BobError extends Error {
  constructor(message: string)
}
```

### CommandNotFoundError

```typescript
class CommandNotFoundError extends BobError {
  constructor(command: string)
}
```

### InvalidOption

```typescript
class InvalidOption extends BobError {
  constructor(option: string, availableOptions: OptionsSchema)
}
```

### MissingRequiredArgumentValue

```typescript
class MissingRequiredArgumentValue extends BobError {
  constructor(argument: string)
}
```

### MissingRequiredOptionValue

```typescript
class MissingRequiredOptionValue extends BobError {
  constructor(option: string)
}
```

### BadCommandOption

```typescript
class BadCommandOption extends BobError {
  constructor(opts: { option: string; reason: string })
}
```

### BadCommandParameter

```typescript
class BadCommandParameter extends BobError {
  constructor(opts: { parameter: string; reason: string })
}
```

---

## Interfaces

### LoggerContract

```typescript
interface LoggerContract {
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  debug(...args: any[]): void;
}
```

### CommandResolver

```typescript
type CommandResolver = (path: string) => Promise<Command | null>
```

### FileImporter

```typescript
type FileImporter = (filePath: string) => Promise<any>
```

---

## Next Steps

- [Getting Started](./getting-started.md) - Start building your CLI
- [Examples](./examples.md) - See complete examples
- [Advanced Topics](./advanced.md) - Deep dive into advanced features
