# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

BOB (Bash Operation Buddy) Core is a TypeScript library for building CLI applications: declarative class-based command definitions, type-safe flag/argument parsing, interactive prompts, and auto-generated help. Currently at **v3.0.0-beta**.

Public docs live in `docs/`. The README is the canonical short-form quick start; the docs in `docs/` are the long-form. Legacy `CommandWithSignature` material is quarantined in `docs/legacy/README.md`.

## Development commands

- `npm run build` — Build CJS + ESM via Vite (outputs to `dist/`)
- `npm test` — Run all Vitest tests
- `npx vitest run src/path/to/file.test.ts` — Run a single test file
- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)
- `npm run lint` / `npm run lint:fix` — ESLint with Prettier
- `npm start` — Run debug script (`debug/main.ts`) via SWC

## Architecture

### Execution flow

```
Cli.runCommand → CommandRegistry.runCommand → Command.run
                                                ↓
                              CommandParser.init → CommandParser.validate
                                                ↓
                                  preHandle? → handle(ctx, parsed)
```

### Core components

| File | Role |
|---|---|
| `src/Cli.ts` | Entry point. Wires `CommandRegistry`, `ExceptionHandler`, and built-in `HelpCommand`. Generic `Cli<C>` for typed context. |
| `src/Command.ts` | Abstract base class. Static metadata (`command`, `description`, `args`, `flags`, `examples`, `group`, `aliases`, `hidden`) plus runtime config (`disablePrompting`, `allowUnknownFlags`, `strictMode`, `disableDefaultOptions`). Instance access to `this.logger`, `this.ux`, `this.ctx`, `this.parser`. Abstract `handle(ctx, parsed)` + optional `preHandle()`. |
| `src/CommandRegistry.ts` | Discovers/loads commands from filesystem paths or class refs. Fuzzy-matches unknown names. Pluggable via `withCommandResolver` / `withFileImporter`. |
| `src/CommandParser.ts` | Parses argv via minimist, validates against schemas, type-converts, prompts for missing required values. |
| `src/CommandWithSignature.ts` | **Deprecated.** Legacy string-signature class (`"cmd {arg} {--opt}"`). Still exported for compat. New code uses `Command`. See `docs/legacy/README.md`. |
| `src/CommandSignatureParser.ts` | Parses the legacy signature strings into flags/args schemas. |
| `src/ExceptionHandler.ts` | Maps thrown errors to exit codes / messages. |
| `src/Logger.ts` | Level-based logger (`log`, `info`, `warn`, `error`, `debug`). Implements `LoggerContract` from `src/contracts/`. |
| `src/HelpFlag.ts` | Default `--help` flag definition (in `Command.baseFlags`). |
| `src/StringSimilarity.ts` | Dice-coefficient fuzzy matcher used for "did you mean?" suggestions. |
| `src/commands/HelpCommand.ts` | Built-in `help` command, registered automatically. |

### Module layout

| Path | Purpose |
|---|---|
| `src/index.ts` | Public exports (re-exports everything below) |
| `src/flags/` | Flag/arg builders (`Flags.string`, `.number`, `.boolean`, `.option`, `.file`, `.directory`, `.url`, `.custom`) |
| `src/args/` | `Args` builder set (same as `Flags` minus `boolean`) |
| `src/ux/` | `UX` class + standalone `askFor*`, `keyValue`, `table`, `newProgressBar`, `newLoader` |
| `src/contracts/` | `LoggerContract` and other public interfaces |
| `src/errors/` | `BobError` and concrete error classes (see below) |
| `src/lib/` | `types.ts` (schemas, `Parsed`), helpers, string utils |
| `src/shared/` | Internal parsers, ask-helpers |

### Flags & Args

Builders are functions; each accepts a common `FlagProps<T>` shape:

```
description, alias, required, default, multiple, help, parse, ask, handler
```

Builder-specific extras:
- `Flags.string` → `secret`
- `Flags.number` → `min`, `max`
- `Flags.option` → `options: readonly [...]`
- `Flags.file` / `Flags.directory` → `exists`
- `Flags.custom<T>` → `parse` is required

`Args` is a separate builder set in `src/args/index.ts` — same as `Flags` minus `boolean`. Use `Args` in `static args` for semantic clarity.

`Flags.boolean` is intentionally absent from `Args` (booleans don't make sense as positional args).

### Type system (`src/lib/types.ts`)

- `FlagProps<T>` — common builder options
- `FlagDefinition` — `FlagProps & { parse(input, opts): any }` (post-builder)
- `FlagsSchema` / `ArgsSchema` — `Record<string, FlagDefinition>` (note: `ArgsSchema` is an alias for `FlagsSchema`)
- `FlagsObject<S>` — infers runtime types from a schema
- `Parsed<T>` — `{ flags, args }` for `T extends typeof Command`
- Internal `type` discriminator: `'string' | 'number' | 'boolean' | 'option' | 'file' | 'directory' | 'url' | 'custom'`

Use `satisfies FlagsSchema` on `static flags` and `static args`, and type the `handle` parsed argument as `Parsed<typeof YourCommand>` for full inference.

### UX (`src/ux/index.ts`)

`this.ux` (instance of `UX`) exposes:

**Prompts:** `askForInput`, `askForPassword`, `askForNumber`, `askForSelect`, `askForCheckbox`, `askForSearch`, `askForConfirmation`, `askForToggle`, `askForList`, `askForEditor`, `askForRawList`, `askForExpand`, `askForFile`, `askForDirectory`, `askForFileSelector`.

**Display:** `table`, `keyValue`, `newProgressBar`, `newLoader`.

All prompts are also exported as standalone functions. Prompts return `Promise<T | null>` where `null` means cancelled (Ctrl+C). Powered by `@inquirer/prompts` plus `inquirer-file-selector`.

### Command definition example

```typescript
import { Command, Flags, Args, Parsed, FlagsSchema } from 'bob-core';

class MyCommand extends Command<MyContext> {
  static command = 'my-command';
  static description = 'Does something';

  static args = {
    target: Args.string({ required: true }),
  } satisfies FlagsSchema;

  static flags = {
    force: Flags.boolean({ description: 'Skip confirmation', alias: 'f' }),
    name: Flags.string({ required: true }),
  } satisfies FlagsSchema;

  async handle(ctx: MyContext, { flags, args }: Parsed<typeof MyCommand>) {
    this.logger.info(`Running on ${args.target}`);
    if (!flags.force) {
      const ok = await this.ux.askForConfirmation('Continue?');
      if (!ok) return 1;
    }
  }
}
```

### baseFlags

`Command.baseFlags` contains shared flags applied to every command (default: `{ help: HelpCommandFlag }`). Override `static baseFlags` in a base class — typically spreading `Command.baseFlags` to keep `--help`. Set `static disableDefaultOptions = true` to skip them entirely.

### Errors (`src/errors/`)

`BobError` is the base. Concrete subclasses:

- `CommandNotFoundError`
- `InvalidFlag`
- `MissingRequiredFlagValue`
- `BadCommandFlag`
- `BadCommandArgument`
- `MissingRequiredArgumentValue`
- `TooManyArguments`
- `ValidationError`

`renderError.ts` formats them for terminal output. `ExceptionHandler` is the dispatch point — subclass `Cli` and override `newExceptionHandler` to customize.

### Module system

- ES modules (`"type": "module"`) with dual CJS/ESM via Vite
- Import paths use `@/src/*` aliases (resolved by both Vite and Vitest)
- Vite outputs to `dist/cjs/` and `dist/esm/`
- Public entry: `src/index.ts`

## Testing

- Vitest (not Jest), tests colocated with source as `*.test.ts`
- `src/fixtures.test.ts` is a helper module (excluded from test runs) — provides `newTestLogger()` and `newFixtures()` for mocked dependencies
- Uses `expectTypeOf` for compile-time type assertions alongside runtime tests

## Documentation

- `README.md` — quick start
- `docs/getting-started.md` — install + first command
- `docs/creating-commands.md` — class anatomy, lifecycle hooks, registration
- `docs/arguments-and-options.md` — `Flags` and `Args` builders in depth
- `docs/interactive-prompts.md` — `this.ux` reference with examples
- `docs/help-system.md` — auto-generated help, grouping, customization
- `docs/advanced.md` — context, custom resolvers, error handling, programmatic execution
- `docs/api-reference.md` — full public surface
- `docs/examples.md` — end-to-end example CLIs
- `docs/legacy/README.md` — deprecated `CommandWithSignature` reference + migration cheat sheet

When the docs say "modern" or "schema-based", that means the `class extends Command` pattern with static `Flags`/`Args`. When they say "signature" or "legacy", that means `CommandWithSignature` — only relevant for users migrating from older versions.
