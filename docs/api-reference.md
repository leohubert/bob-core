# API Reference

Public surface of `bob-core`. All exports come from the package root.

```typescript
import {
  Cli, Command, CommandRegistry, CommandParser, ExceptionHandler, Logger,
  Flags, Args, UX, StringSimilarity,
  // ...types and errors below
} from 'bob-core';
```

---

## `Cli<C>`

Main CLI orchestrator. Manages command registration, exception handling, and the built-in help command.

### Constructor

```typescript
new Cli<C = any>(options?: CliOptions<C>)

interface CliOptions<C> {
  ctx?: C;            // Context injected into every command
  name?: string;      // CLI name (used in help header)
  version?: string;   // CLI version (used in help header)
  logger?: Logger;    // Custom logger
  binName?: string;   // Executable name as typed (e.g. `bdg`), used by completion scripts.
                      // Distinct from `name`; defaults to the basename of the running script.
  disableCompletion?: boolean;              // Skips the `completion` / `__complete` pair
  completionCache?: CompletionCacheOptions; // Answers completion from a snapshot on disk
}
```

### Methods

```typescript
withCommands(...commands: Array<typeof Command<C> | Command<C> | string>): Promise<void>
                     // Classes/instances register now; a directory is queued and walked on dispatch
withCommandResolver(resolver: CommandResolver): this
withFileImporter(importer: FileImporter): this
runCommand(command: string | typeof Command | Command | undefined, ...args: string[]): Promise<number>
runHelpCommand(): Promise<number>
```

### Properties

```typescript
cli.commandRegistry: CommandRegistry
```

### Protected hooks for subclassing

```typescript
protected newCommandRegistry(opts): CommandRegistry
protected newHelpCommand(opts: HelpCommandOptions): HelpCommand
protected newExceptionHandler(opts: { logger: Logger }): ExceptionHandler
```

---

## `Command<C>`

Abstract base class for commands.

### Static metadata

```typescript
static command: string                    // command name
static description: string                // shown in help
static group?: string                     // group label
static aliases: string[]                  // alternate names
static args: ArgsSchema                   // positional arguments schema
static flags: FlagsSchema                 // named flags schema
static examples: CommandRunExample[]      // help examples
static hidden: boolean                    // exclude from help listing

// Configuration
static disableDefaultOptions: boolean     // skip baseFlags entirely
static disablePrompting: boolean          // never prompt for missing required values
static allowUnknownFlags: boolean         // tolerate unknown flags
static strictMode: boolean                // strict argument handling
static baseFlags: FlagsSchema             // shared flags (default: { help: HelpCommandFlag })
```

### Instance properties (available inside `handle`)

```typescript
protected ctx: C
protected logger: Logger
protected ux: UX
protected parser: CommandParser
```

### Methods

```typescript
protected abstract handle(ctx: C, parsed: Parsed<this>): Promise<number | void> | number | void
protected preHandle?(): Promise<void | number>

async run(opts: CommandRunOption<C>): Promise<number | void>

// Subclassing hooks
protected newCommandParser(opts): CommandParser
protected newUX(): UX
```

### `CommandRunOption<C>`

```typescript
type CommandRunOption<C> = { logger: Logger; ctx: C } & (
  | { args: string[] }                                            // raw, will be parsed
  | { args: Record<string, any>; flags: Record<string, any> }     // pre-parsed
);
```

### `CommandRunExample`

```typescript
type CommandRunExample = { description: string; command: string };
```

---

## `CommandWithSignature<C>` (deprecated)

Legacy class supporting the signature-string syntax. See [legacy/README.md](./legacy/README.md).

---

## `Flags` and `Args` builders

```typescript
import { Flags, Args } from 'bob-core';
```

`Flags` exposes: `string`, `number`, `boolean`, `option`, `search`, `file`, `directory`, `url`, `custom`.
`Args` is the same set minus `boolean`.

### Common options (`FlagProps<T>`)

```typescript
{
  description?: string;
  alias?: string | readonly string[];
  required?: boolean;
  default?: T | T[] | null | (() => Promise<T | T[] | null>);
  multiple?: boolean;
  help?: string;
  parse?: (input: any, opts: ParameterOpts) => T;
  ask?: (opts: ParameterOpts) => Promise<any>;
  complete?: (opts: CompletionOpts) => Promise<CompletionCandidate[]>;  // shell completion
  handler?: (value: T, opts: ParameterOpts) => { shouldStop: boolean } | void;
}
```

### Builder-specific options

| Builder | Extra options |
|---|---|
| `Flags.string`     | `secret?: boolean` |
| `Flags.number`     | `min?: number`, `max?: number` |
| `Flags.boolean`    | — |
| `Flags.option`     | `options: readonly T[]` |
| `Flags.search`     | `source: ValueSource<T>` (required) |
| `Flags.file`       | `exists?: boolean` |
| `Flags.directory`  | `exists?: boolean` |
| `Flags.url`        | — |
| `Flags.custom<T>`  | `parse: (input, opts) => T` (required) |

---

## `UX`

Interactive prompts and display utilities. Available inside commands as `this.ux`.

### Prompts

```typescript
askForConfirmation(message?: string, opts?: AskForConfirmationOptions): Promise<boolean>
askForInput(message: string, opts?: AskForInputOptions): Promise<string | null>
askForPassword(message: string, opts?: AskForPasswordOptions): Promise<string | null>
askForNumber(message: string, opts?: AskForNumberOptions): Promise<number | null>
askForSelect<V>(message: string, choices: Array<string | SelectOption<V>>, opts?: AskForSelectOptions<V>): Promise<V | null>
askForCheckbox<V>(message: string, choices: Array<string | SelectOption<V>>, opts?: AskForCheckboxOptions<V>): Promise<V[] | null>
askForSearch<V>(message: string, source: SearchSource<V>, opts?: AskForSearchOptions<V>): Promise<V | null>
askForList(message: string, opts?: AskForListOptions): Promise<string[] | null>
askForToggle(message: string, opts?: AskForToggleOptions): Promise<boolean>
askForEditor(message: string, opts?: AskForEditorOptions): Promise<string | null>
askForRawList<V>(message: string, choices: Array<{ key?: string; name?: string; value: V }>, opts?: AskForRawListOptions): Promise<V | null>
askForExpand<V>(message: string, choices: Array<{ key: ExpandKey; name: string; value: V }>, opts?: AskForExpandOptions): Promise<V | null>
askForFile(message: string, opts?: Omit<AskForFileSelectorOptions, 'type'>): Promise<string | null>
askForDirectory(message: string, opts?: Omit<AskForFileSelectorOptions, 'type'>): Promise<string | null>
askForFileSelector(message: string, opts?: AskForFileSelectorOptions): Promise<string | null>
```

### Display

```typescript
keyValue(pairs: Record<string, unknown> | Array<[string, unknown]>, opts?: KeyValueOptions): void
table<T>(data: T[], columns?: TableColumn<T>[]): void
newProgressBar(total: number, opts?: ProgressBarOptions): ProgressBar
newLoader(text?: string, chars?: string[], delay?: number): Loader
```

All `askFor*` methods are also exported as standalone functions.

---

## `Logger`

Level-based logger implementing `LoggerContract`.

```typescript
class Logger {
  log(...args: unknown[]): void
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
  debug(...args: unknown[]): void
}
```

### `LoggerContract`

```typescript
interface LoggerContract {
  log(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  debug(...args: unknown[]): void;
}
```

---

## `CommandRegistry`

Manages command registration and discovery.

```typescript
registerCommand(command: typeof Command | Command, force?: boolean): void
registerBuiltInCommand(command: Command): void
loadCommandsPath(commandsPath: string): Promise<void>   // Walks a directory now
deferCommandsPath(commandsPath: string): this           // Queues it for ensureLoaded instead
ensureLoaded(): Promise<void>                           // Walks every queued path; memoized
runCommand(ctx: any, command: string | typeof Command | Command, ...args: string[]): Promise<number>
getAvailableCommands(): string[]
getCommands(): Array<typeof Command>
findCommand(name: string): typeof Command | null
withCommandResolver(resolver: CommandResolver): this
withFileImporter(importer: FileImporter): this
```

`registerCommand` accepts a class (constructed per run) or a ready-made instance (reused as-is —
for commands whose constructor needs collaborators). `getCommands` always returns classes.

`registerBuiltInCommand` registers a framework command in a lower-priority layer: a host command
of the same name shadows it silently rather than colliding. `Cli` uses it for `help`, `completion`,
and `__complete`.

### `CommandResolver` and `FileImporter`

```typescript
type CommandResolver = (filePath: string) => Promise<typeof Command | null>
type FileImporter    = (filePath: string) => Promise<unknown>
```

---

## `CommandParser`

Used internally by `Command#run`. Most users won't construct one directly. Notable methods exposed via `this.parser` inside a command:

```typescript
allowUnknownFlags(): this
strictMode(): this
disablePrompting(): this
flag<T>(key: string, fallback?: T): T | null
argument<T>(key: string, fallback?: T): T | null
init(args: string[]): Promise<{ flags: Record<string, any>; args: Record<string, any> }>
validate(): Promise<void>
```

---

## `ExceptionHandler`

Maps thrown errors to exit codes and friendly messages. Subclass and override `Cli.newExceptionHandler` to customize.

```typescript
class ExceptionHandler {
  constructor(logger: Logger)
  handle(error: Error): Promise<number>
}
```

---

## Type definitions

```typescript
// Schemas
type FlagsSchema  = { [key: string]: FlagDefinition };
type ArgsSchema   = FlagsSchema;

// Inference helpers
type Parsed<T>            = { flags: FlagsObject<InferFlags<T>>; args: FlagsObject<InferArgs<T>> };
type FlagsObject<S>       = { [K in keyof S]: FlagReturnType<S[K]> };

// Flag definition (after passing through a builder)
type FlagDefinition = FlagProps & { parse(input: any, opts: ParameterOpts): any };

// Built-in flag types
type FlagType = 'string' | 'number' | 'boolean' | 'option' | 'file' | 'directory' | 'url' | 'custom';
```

### UX types

```typescript
type SelectOption<V = string> = { name: string; value: V; description?: string; disabled?: boolean };
type TableColumn<T>           = { key: keyof T; header?: string; align?: TableColumnAlignment };
type TableColumnAlignment     = 'left' | 'right' | 'center';
type KeyValueOptions          = { /* alignment, separator, etc. */ };
type ProgressBarOptions       = { /* width, format, etc. */ };
```

---

## Errors

All errors extend `BobError`.

| Class | Thrown when |
|---|---|
| `BobError` | Base class |
| `CommandNotFoundError` | Command name doesn't resolve |
| `InvalidFlag` | Flag value is invalid |
| `MissingRequiredFlagValue` | Required flag is missing (and prompting is disabled) |
| `BadCommandFlag` | Flag fails parser validation |
| `BadCommandArgument` | Argument fails parser validation |
| `MissingRequiredArgumentValue` | Required argument missing |
| `TooManyArguments` | Extra positional arguments in strict mode |
| `ValidationError` | Generic validation failure |

---

## Shell completion

See [shell-completion.md](shell-completion.md) for the full guide.

```typescript
// Snapshot the registry into plain, JSON-serializable metadata
commandSpecs(registry: CommandRegistry): CommandSpec[]

// Static resolution: candidates plus, when the slot has live values, a `dynamic` marker
completeArgv(specs: CommandSpec[], words: string[]): CompletionPlan

// Static + dynamic. `loadCommand` is only called when a dynamic slot is reached.
resolveCompletion(opts: {
  specs: CommandSpec[];
  words: string[];
  ctx?: any;
  loadCommand?: CommandLoader;
  timeoutMs?: number;      // default 1500
}): Promise<CompletionCandidate[]>

// Wire protocol used by the generated scripts
parseCompletionRequest(argv: string[]): { shell: CompletionShell; words: string[] } | null

// Script generation and candidate encoding (fish is the only dialect with a renderer)
renderFishScript(opts: { binName: string }): string
encodeFishCandidates(candidates: CompletionCandidate[]): string
fishCompletionPath(binName: string): string   // ~/.config/fish/completions/<bin>.fish

// True when this invocation's stdout is machine-readable, so a host must stay silent on it
writesMachineOutput(argv: string[]): boolean

// Metadata snapshot on disk, so a keypress imports no command modules
readSpecCache(opts: CompletionCacheOptions): CommandSpec[] | null
writeSpecCache(opts: CompletionCacheOptions, specs: CommandSpec[]): void

interface CompletionCacheOptions {
  file: string;     // Absolute path — a relative one resolves against the user's cwd
  version: string;  // Invalidation key; a mismatch discards the snapshot
}

COMPLETION_SHELLS   // ['fish']
COMPLETION_COMMAND  // 'completion'
COMPLETE_COMMAND    // '__complete'
```

---

## `StringSimilarity`

Used internally for fuzzy "did you mean?" suggestions, exposed for general use.

```typescript
class StringSimilarity {
  calculateSimilarity(a: string, b: string): number
  findBestMatch(target: string, candidates: string[]): {
    bestMatch: { rating: number; target: string };
    bestMatchIndex: number;
    ratings: Array<{ rating: number; target: string }>;
  }
}
```

---

## See also

- [Getting Started](./getting-started.md)
- [Creating Commands](./creating-commands.md)
- [Arguments & Options](./arguments-and-options.md)
- [Interactive Prompts](./interactive-prompts.md)
- [Shell Completion](./shell-completion.md)
- [Examples](./examples.md)
- [Legacy: CommandWithSignature](./legacy/README.md)
