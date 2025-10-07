# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BOB (Bash Operation Buddy) Core is a TypeScript library for building CLI applications with declarative command definitions, type-safe argument/option parsing, and automatic help generation.

## Development Commands

- `npm run build` - Build both CommonJS and ESM distributions using Vite
- `npm test` - Run Vitest tests
- `npm run typecheck` - Run TypeScript type checking
- `npm start` - Run debug script (`debug/main.ts`) with SWC transpilation

## Architecture

### Core Components

The library uses a layered architecture separating concerns between command management, parsing, and execution:

- **Cli** (`src/Cli.ts`) - Main entry point that orchestrates the CLI lifecycle. Manages CommandRegistry, ExceptionHandler, and built-in HelpCommand
- **Command** (`src/Command.ts`) - Modern base class for commands with type-safe schema definitions and handler functions
- **CommandRegistry** (`src/CommandRegistry.ts`) - Discovers, loads, and executes commands from files or class instances. Includes fuzzy-matching for command suggestions
- **CommandParser** (`src/CommandParser.ts`) - Parses raw CLI arguments using minimist, validates them against schemas, and handles type conversion
- **CommandSignatureParser** (`src/CommandSignatureParser.ts`) - Extends CommandParser to support legacy string signature syntax (e.g., `"cmd {arg} {--option}"`)
- **CommandIO** (`src/CommandIO.ts`) - Handles interactive prompts and user I/O via the prompts library

### Command System

BOB Core supports two command definition styles:

**Modern Schema-Based (Recommended):**
```typescript
new Command('my-command', {
  description: 'Command description',
  options: { force: { type: 'boolean', default: false } },
  arguments: { name: 'string' }
}).handler(async (ctx, { options, arguments }) => {
  // Type-safe access to options.force and arguments.name
})
```

**Signature-Based:**
Commands can use string signatures parsed by CommandSignatureParser:
- `{arg}` - Required argument
- `{arg?}` - Optional argument
- `{arg=default}` - Argument with default value
- `{arg*}` - Variadic argument (array)
- `{--option}` - Boolean option (default false)
- `{--option=}` - String option
- `{--option=*}` - Array option
- `{--option|o}` - Option with alias

### Type System

The type system (`src/lib/types.ts`) provides compile-time safety for command schemas:
- `OptionDefinition` - Defines argument/option metadata (type, required, default, aliases, secret)
- `OptionsSchema` / `ArgumentsSchema` - Maps parameter names to their definitions
- `OptionsObject` / `ArgumentsObject` - Infers runtime types from schemas
- **Supported types:** `'string'`, `'number'`, `'boolean'`, `['string']`, `['number']`
- **Secret input:** For masked/password input, use `{ type: 'string', secret: true }`. Note: `secret` is a boolean flag on OptionDefinition, not a type itself. It masks input in interactive prompts.

### Module System

- ES modules with dual CJS/ESM distribution via Vite
- Import paths use `@/src/*` aliases that resolve to `./src/*`
- Vite config creates separate `dist/cjs/` (CommonJS) and `dist/esm/` (ES Module) outputs

### Error Handling

Custom error classes in `src/errors/` provide specific error types for validation failures (MissingRequiredArgumentValue, InvalidOption, CommandNotFoundError, etc.). ExceptionHandler converts these to user-friendly messages.

## Testing

- Uses Vitest (not Jest) for testing
- Tests are located alongside source files with `.test.ts` suffix
- Run all tests: `npm test`
- Test fixtures available in `src/testFixtures.ts`