# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BOB (Bash Operation Buddy) Core is a TypeScript library for building CLI applications with declarative command definitions, type-safe argument/option parsing, and automatic help generation. Currently at v3.0.0-alpha.

## Development Commands

- `npm run build` - Build both CommonJS and ESM distributions using Vite
- `npm test` - Run all Vitest tests
- `npx vitest run src/path/to/file.test.ts` - Run a single test file
- `npm run typecheck` - TypeScript type checking
- `npm run lint` / `npm run lint:fix` - ESLint with Prettier
- `npm start` - Run debug script (`debug/main.ts`) with SWC transpilation

## Architecture

### Execution Flow

Cli → CommandRegistry → Command.run() → CommandParser → preHandle() → handle()

### Core Components

- **Cli** (`src/Cli.ts`) - Entry point. Manages CommandRegistry, ExceptionHandler, and built-in HelpCommand. Supports typed context injection via generic `C`.
- **Command** (`src/Command.ts`) - Base class for commands. Static metadata (`command`, `description`, `flags`, `args`, `examples`, `group`, `hidden`). Instance access to `this.logger`, `this.ux`, `this.parser`. Abstract `handle(ctx, parsed)` method with optional `preHandle()` hook.
- **CommandRegistry** (`src/CommandRegistry.ts`) - Discovers and loads commands from filesystem paths or class instances. Fuzzy-matches unknown commands for suggestions.
- **CommandParser** (`src/CommandParser.ts`) - Parses CLI arguments via minimist, validates against schemas, handles type conversion, and prompts for missing required values.
- **CommandWithSignature** (`src/CommandWithSignature.ts`) - Deprecated. Legacy string signature syntax (e.g., `"cmd {arg} {--option}"`). Use `Command` instead.

### Flags & Args System (`src/flags/`)

Builder functions for type-safe flag/argument definitions. `Args` is an alias for `Flags` (same builders, used for semantic clarity in argument schemas).

Available builders: `Flags.string()`, `Flags.number()`, `Flags.boolean()`, `Flags.options()`, `Flags.file()`, `Flags.directory()`, `Flags.url()`, `Flags.custom()`

Each accepts: `description`, `alias`, `required`, `default`, `multiple`, `help`, `parse`, `handler`, `ask`

### Logger & UX

- **Logger** (`src/Logger.ts`) - Level-based logging (`debug`, `info`, `warn`, `error`). Implements `LoggerContract` from `src/contracts/`. Accessed via `this.logger` in commands.
- **UX** (`src/ux/`) - Interactive prompts (`askForInput`, `askForSelect`, `askForConfirmation`, `askForPassword`, etc.) and display utilities (`table`, `keyValue`, `newProgressBar`, `newLoader`). Uses `@inquirer/prompts`. Accessed via `this.ux` in commands.

### Command Definition Example

```typescript
class MyCommand extends Command<MyContext> {
  static command = 'my-command';
  static description = 'Does something';
  static flags = {
    force: Flags.boolean({ description: 'Skip confirmation' }),
    name: Flags.string({ required: true }),
  };
  static args = {
    target: Args.string(),
  };

  async handle(ctx: MyContext, { flags, args }: Parsed<typeof MyCommand>) {
    this.logger.info('Running...');
    if (!flags.force) {
      await this.ux.askForConfirmation({ message: 'Continue?' });
    }
  }
}
```

### Signature Syntax (Legacy)

Supported via `CommandWithSignature`: `{arg}` required, `{arg?}` optional, `{arg=default}` with default, `{arg*}` variadic, `{--option}` boolean flag, `{--option=}` string flag, `{--option=*}` array flag, `{--option|o}` with alias.

### Type System (`src/lib/types.ts`)

- `FlagDefinition` - Discriminated union of all flag types
- `FlagsSchema` / `ArgumentsSchema` - Maps parameter names to definitions
- `FlagsObject<S>` / `ArgumentsObject<S>` - Infers runtime types from schemas
- `Parsed<T>` - Result type with `flags` and `args` objects
- Supported types: `'string'`, `'number'`, `'boolean'`, `['string']`, `['number']`

### Module System

- ES modules (`"type": "module"`) with dual CJS/ESM distribution via Vite
- Import paths use `@/src/*` aliases resolving to `./src/*`
- Vite outputs to `dist/cjs/` and `dist/esm/`

### Error Handling

Custom error classes in `src/errors/` for validation failures (MissingRequiredArgumentValue, InvalidOption, CommandNotFoundError, etc.). `ExceptionHandler` converts these to user-friendly messages.

## Testing

- Vitest (not Jest), tests colocated with source as `.test.ts`
- `src/fixtures.test.ts` provides `newTestLogger()` and `newFixtures()` for mocked dependencies (excluded from test runs — it's a helper module)
- Uses `expectTypeOf` for compile-time type assertions alongside runtime tests
