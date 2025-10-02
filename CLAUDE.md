# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BOB Core is a TypeScript library for creating CLI applications. It provides command parsing, argument handling, help generation, and command registration.

## Development Commands

- `npm run build` - Build both CommonJS and ESM distributions
- `npm run build:cjs` - Build CommonJS distribution only
- `npm run build:esm` - Build ESM distribution only
- `npm test` - Run Jest tests
- `npm start` - Run debug script with SWC transpilation

## Architecture

### Core Components

- **CLI** (`src/Cli.ts`) - Main CLI class that orchestrates command execution
- **LegacyCommand** (`src/LegacyCommand.ts`) - Abstract base class for all commands
- **CommandRegistry** (`src/CommandRegistry.ts`) - Manages command registration and discovery
- **CommandParser** (`src/CommandParser.ts`) - Parses command signatures and arguments

### LegacyCommand System

Commands are defined with signatures like `"my-command {arg1} {arg2?} {--option1} {--option2=value}"`:
- `{arg}` - Required argument
- `{arg?}` - Optional argument
- `{arg=default}` - Argument with default value
- `{arg*}` - Variadic argument (array)
- `{--option}` - Boolean option (default false)
- `{--option=}` - String option
- `{--option=*}` - Array option

### Directory Structure

- `src/commands/` - Built-in commands (HelpCommand)
- `src/contracts/` - TypeScript interfaces and types
- `src/errors/` - Custom error classes
- `src/options/` - LegacyCommand options (HelpOption)
- `src/lib/` - Utility functions

### Module System

The project uses ES modules with dual CJS/ESM distribution. Import paths use `@/src/*` aliases that resolve to `./src/*`.

## Testing

Uses Jest with ts-jest preset. Tests are located alongside source files with `.test.ts` suffix.