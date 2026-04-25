# Legacy: `CommandWithSignature`

> **Deprecated.** `CommandWithSignature` is preserved for backwards compatibility only and will be removed in a future major release. New code should use the schema-based `Command` class — see [../creating-commands.md](../creating-commands.md).

This document covers the legacy signature-string syntax. If you're still on `CommandWithSignature`, this is the reference. If you're starting fresh, skip to the modern docs.

## When you'd see this

`CommandWithSignature` lets you define a command's arguments and flags from a single signature string instead of declaring them as `static flags` / `static args` schemas. It still extends `Command`, so the rest of the runtime (UX, logger, parser, context) behaves the same way.

```typescript
import { CommandWithSignature } from 'bob-core';

export default class DeployCommand extends CommandWithSignature {
  static signature = 'deploy {environment} {--force} {--region=us-east-1}';
  static description = 'Deploy an application';

  static helperDefinitions = {
    environment: 'Target environment',
    '--force': 'Skip confirmation prompts',
    '--region': 'AWS region',
  };

  protected async handle() {
    const environment = this.argument<string>('environment');
    const force = this.option<boolean>('force');
    const region = this.option<string>('region');

    this.logger.info(`Deploying to ${environment} (${region}), force=${force}`);
  }
}
```

## Signature syntax

Format: `command-name {arg1} {arg2} {--option1} {--option2}`

### Arguments

| Token | Meaning |
|---|---|
| `{arg}` | Required argument |
| `{arg?}` | Optional argument |
| `{arg=default}` | Argument with default value |
| `{arg*}` | Variadic (array) argument |
| `{arg*?}` | Optional variadic argument |

### Flags / options

| Token | Meaning |
|---|---|
| `{--flag}` | Boolean flag (defaults to `false`) |
| `{--flag=}` | String flag (defaults to `null`) |
| `{--flag=value}` | String flag with default value |
| `{--flag=*}` | Array flag (multi-value) |
| `{--flag\|f}` | Flag with one alias |
| `{--flag\|f\|fl}` | Flag with multiple aliases |

Aliases also work on positional arguments: `{name|n}`.

## Helper accessors

`CommandWithSignature` exposes two convenience methods on top of the standard `Command` API:

```typescript
// Get a parsed argument
const name = this.argument<string>('name');
const name = this.argument<string>('name', 'Anonymous'); // with fallback

// Get a parsed flag/option
const verbose = this.option<boolean>('verbose');
const port = this.option<number>('port', 3000); // with fallback
```

Everything else — `this.logger`, `this.ux`, `this.ctx`, `preHandle()`, `handle()`, `static description`, `static group`, `static examples`, `static aliases` — works exactly as it does on `Command`.

## Help text via `helperDefinitions`

Because the signature string can't carry descriptions, `CommandWithSignature` accepts an optional `helperDefinitions` map keyed by argument name (or `--flag` for flags):

```typescript
static helperDefinitions = {
  environment: 'The deployment target',
  '--force': 'Skip confirmation prompts',
  '--region': 'AWS region',
};
```

These are surfaced through the same help system as `description` fields on schema-based commands.

## Migrating to schema-based `Command`

The mapping is mechanical:

```typescript
// Before
export default class DeployCommand extends CommandWithSignature {
  static signature = 'deploy {environment} {--force} {--region=us-east-1}';
  static description = 'Deploy an application';
  static helperDefinitions = {
    environment: 'Target environment',
    '--force': 'Skip confirmation prompts',
    '--region': 'AWS region',
  };

  protected async handle() {
    const environment = this.argument<string>('environment');
    const force = this.option<boolean>('force');
    const region = this.option<string>('region');
    // ...
  }
}

// After
import { Command, Flags, Args, Parsed } from 'bob-core';

export default class DeployCommand extends Command {
  static command = 'deploy';
  static description = 'Deploy an application';

  static args = {
    environment: Args.string({ required: true, description: 'Target environment' }),
  };

  static flags = {
    force: Flags.boolean({ description: 'Skip confirmation prompts' }),
    region: Flags.string({ default: 'us-east-1', description: 'AWS region' }),
  };

  async handle(_ctx: any, { flags, args }: Parsed<typeof DeployCommand>) {
    // args.environment, flags.force, flags.region — fully typed
  }
}
```

Migration cheat sheet:

| Signature | Schema equivalent |
|---|---|
| `{arg}` | `Args.string({ required: true })` |
| `{arg?}` | `Args.string()` |
| `{arg=value}` | `Args.string({ default: 'value' })` |
| `{arg*}` | `Args.string({ multiple: true, required: true })` |
| `{--flag}` | `Flags.boolean()` |
| `{--flag=}` | `Flags.string()` |
| `{--flag=value}` | `Flags.string({ default: 'value' })` |
| `{--flag=*}` | `Flags.string({ multiple: true })` |
| `{--flag\|f}` | `Flags.boolean({ alias: 'f' })` |

## See also

- [Creating Commands](../creating-commands.md) — the modern, schema-based API
- [Arguments & Options](../arguments-and-options.md) — `Flags` / `Args` builders
