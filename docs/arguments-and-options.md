# Arguments & Options

BOB Core uses **builder functions** to declare typed flags and positional arguments. `Flags` is the full set; `Args` is the same set minus `boolean` (booleans rarely make sense as positional arguments).

> The legacy signature-string syntax (`{arg}`, `{--option}`) lives in [legacy/README.md](./legacy/README.md). New code should use the builders below.

## Builders

```typescript
import { Flags, Args } from 'bob-core';

Flags.string({ ... })
Flags.number({ ... })
Flags.boolean({ ... })
Flags.option({ options: [...], ... })
Flags.file({ ... })
Flags.directory({ ... })
Flags.url({ ... })
Flags.custom<T>({ parse: ..., ... })
```

| Builder | Parsed type | Builder-specific options |
|---|---|---|
| `Flags.string()` | `string` | `secret` |
| `Flags.number()` | `number` | `min`, `max` |
| `Flags.boolean()` | `boolean` | — |
| `Flags.option()` | union of `options` | `options: readonly [...]` |
| `Flags.file()` | `string` | `exists` |
| `Flags.directory()` | `string` | `exists` |
| `Flags.url()` | `URL` | — |
| `Flags.custom<T>()` | `T` | `parse` (required) |

## Common options

Every builder accepts:

| Option | Type | Description |
|---|---|---|
| `description` | `string` | Help text |
| `alias` | `string \| string[]` | Short name(s), e.g. `'v'` for `-v` |
| `required` | `boolean` | Error if missing (or prompt — see below) |
| `default` | `T \| (() => Promise<T>)` | Default value or async resolver |
| `multiple` | `boolean` | Accept multiple values; result becomes an array |
| `help` | `string` | Long-form help text |
| `parse` | `(input, opts) => T` | Custom parser |
| `ask` | `(opts) => Promise<T>` | Custom prompt for missing values |
| `handler` | `(value, opts) => { shouldStop } \| void` | Run logic when the flag is provided (e.g. `--version`) |

## Type inference

Use `satisfies FlagsSchema` and `Parsed<typeof YourCommand>` to get full inference:

```typescript
import { Command, Flags, Args, Parsed, FlagsSchema } from 'bob-core';

export default class ProcessCommand extends Command {
  static command = 'process';

  static args = {
    input: Args.string({ required: true }),
    output: Args.string({ default: null }),
  } satisfies FlagsSchema;

  static flags = {
    verbose: Flags.boolean({ alias: 'v' }),
    format: Flags.option({ options: ['json', 'xml', 'csv'] as const, default: 'json' }),
    tags: Flags.string({ multiple: true }),
    timeout: Flags.number({ min: 0, default: 30 }),
  } satisfies FlagsSchema;

  async handle(_ctx, { flags, args }: Parsed<typeof ProcessCommand>) {
    // args.input: string
    // args.output: string | null
    // flags.verbose: boolean
    // flags.format: 'json' | 'xml' | 'csv'
    // flags.tags: string[]
    // flags.timeout: number
  }
}
```

## Arguments

Positional arguments are declared via `static args` using `Args` builders.

```typescript
static args = {
  source: Args.string({ required: true }),
  destination: Args.string({ required: true }),
  count: Args.number({ default: 1 }),
};
```

### Variadic arguments

Use `multiple: true` to consume the rest of the positional input as an array.

```typescript
static args = {
  files: Args.string({ multiple: true, required: true }),
};

// Usage: my-cli rm a.txt b.txt c.txt
// args.files = ['a.txt', 'b.txt', 'c.txt']
```

## Flags

```typescript
static flags = {
  force: Flags.boolean({ alias: 'f', description: 'Skip confirmation' }),
  output: Flags.string({ description: 'Output file' }),
  port: Flags.number({ default: 3000, min: 1, max: 65535 }),
  level: Flags.option({ options: ['debug', 'info', 'warn'] as const, default: 'info' }),
};
```

### Multiple values

```typescript
tags: Flags.string({ multiple: true })
// my-cli run --tags=urgent --tags=bug
// flags.tags = ['urgent', 'bug']
```

### Aliases

```typescript
verbose: Flags.boolean({ alias: ['v', 'V'] })
// my-cli run --verbose | -v | -V
```

### Secret / password input

`secret: true` masks the value in interactive prompts (does not change the parsed type).

```typescript
password: Flags.string({ secret: true, required: true })
```

### Enums via `Flags.option`

```typescript
format: Flags.option({ options: ['json', 'xml', 'csv'] as const, default: 'json' })
// flags.format is typed as 'json' | 'xml' | 'csv'
```

### Files & directories

```typescript
config:  Flags.file({ exists: true, description: 'Path to config file' }),
outDir:  Flags.directory({ exists: true }),
```

`exists: true` validates that the path exists at parse time.

### URLs

```typescript
endpoint: Flags.url({ description: 'API endpoint' })
// flags.endpoint is a parsed URL instance
```

### Custom types

`Flags.custom<T>` covers anything not built-in. Provide a `parse` function:

```typescript
since: Flags.custom<Date>({
  parse: (input) => new Date(input),
  description: 'Start date (YYYY-MM-DD)',
}),
```

## Required values & prompting

Required values that aren't supplied on the command line will prompt the user (using `this.ux`) unless prompting is disabled. To skip the prompt and fail fast, set `static disablePrompting = true` on the command.

You can also override prompting per-flag with `ask`:

```typescript
name: Flags.string({
  required: true,
  ask: async ({ ux }) => ux.askForInput('Your name?'),
}),
```

## Validation

- Type conversion (`'42'` → `42`) is automatic for `number`.
- `Flags.option` rejects values not in its `options` list.
- `Flags.file` / `Flags.directory` with `exists: true` validate the filesystem.
- Custom validation goes in `parse` (throw to reject) or in `preHandle()` for cross-field checks.

## Default values

Defaults can be a literal or an async resolver:

```typescript
config: Flags.string({ default: () => loadDefaultConfigPath() }),
port:   Flags.number({ default: 3000 }),
```

## Complete example

```typescript
import { Command, Flags, Args, Parsed, FlagsSchema } from 'bob-core';

export default class ProcessCommand extends Command {
  static command = 'process';
  static description = 'Process files';

  static args = {
    input: Args.string({ required: true, description: 'Input file path' }),
    output: Args.string({ description: 'Output file path' }),
  } satisfies FlagsSchema;

  static flags = {
    verbose: Flags.boolean({ alias: 'v' }),
    format: Flags.option({ options: ['json', 'xml'] as const, default: 'json' }),
    tags: Flags.string({ multiple: true }),
    timeout: Flags.number({ default: 30 }),
  } satisfies FlagsSchema;

  async handle(_ctx, { flags, args }: Parsed<typeof ProcessCommand>) {
    this.ux.keyValue({
      input: args.input,
      output: args.output ?? '(stdout)',
      format: flags.format,
      tags: flags.tags.join(', ') || '(none)',
      timeout: `${flags.timeout}s`,
    });
  }
}
```

## Next steps

- [Interactive Prompts](./interactive-prompts.md)
- [Help System](./help-system.md)
- [API Reference](./api-reference.md)
