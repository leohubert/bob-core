# Examples

Real-world examples of CLI applications built with BOB Core.

## Table of contents

- [Simple file manager](#simple-file-manager)
- [Database CLI with context](#database-cli-with-context)
- [Subcommand groups](#subcommand-groups)
- [Interactive project wizard](#interactive-project-wizard)
- [REST API client](#rest-api-client)

---

## Simple file manager

`cli.ts`:

```typescript
import { Cli } from 'bob-core';

const cli = new Cli({ name: 'filemanager', version: '1.0.0' });
await cli.withCommands('./commands');

const exitCode = await cli.runCommand(process.argv[2], ...process.argv.slice(3));
process.exit(exitCode);
```

`commands/copy.ts`:

```typescript
import { Command, Flags, Args, Parsed, FlagsSchema } from 'bob-core';
import { copyFileSync, existsSync } from 'node:fs';

export default class CopyCommand extends Command {
  static command = 'copy';
  static description = 'Copy a file';

  static args = {
    source: Args.string({ required: true }),
    destination: Args.string({ required: true }),
  } satisfies FlagsSchema;

  static flags = {
    overwrite: Flags.boolean({ description: 'Overwrite if destination exists' }),
  } satisfies FlagsSchema;

  async handle(_ctx, { flags, args }: Parsed<typeof CopyCommand>) {
    if (!flags.overwrite && existsSync(args.destination)) {
      const ok = await this.ux.askForConfirmation(`${args.destination} exists. Overwrite?`);
      if (!ok) return 1;
    }

    copyFileSync(args.source, args.destination);
    this.logger.info(`Copied ${args.source} → ${args.destination}`);
  }
}
```

`commands/list.ts`:

```typescript
import { Command, Args, Parsed, FlagsSchema } from 'bob-core';
import { readdirSync } from 'node:fs';

export default class ListCommand extends Command {
  static command = 'list';
  static description = 'List files in directory';

  static args = {
    path: Args.string({ default: '.' }),
  } satisfies FlagsSchema;

  async handle(_ctx, { args }: Parsed<typeof ListCommand>) {
    for (const file of readdirSync(args.path ?? '.')) {
      this.logger.info(file);
    }
  }
}
```

---

## Database CLI with context

`context.ts`:

```typescript
import { Client } from 'pg';

export interface DbContext {
  db: Client;
}
```

`cli.ts`:

```typescript
import { Cli } from 'bob-core';
import { Client } from 'pg';
import type { DbContext } from './context.js';

const db = new Client({ /* ... */ });
await db.connect();

const cli = new Cli<DbContext>({
  ctx: { db },
  name: 'dbcli',
  version: '1.0.0',
});

await cli.withCommands('./commands');
const exitCode = await cli.runCommand(process.argv[2], ...process.argv.slice(3));
await db.end();
process.exit(exitCode);
```

`commands/query.ts`:

```typescript
import { Command, Flags, Args, Parsed, FlagsSchema } from 'bob-core';
import type { DbContext } from '../context.js';

export default class QueryCommand extends Command<DbContext> {
  static command = 'query';
  static description = 'Execute a SQL query';

  static args = {
    sql: Args.string({ required: true }),
  } satisfies FlagsSchema;

  static flags = {
    format: Flags.option({ options: ['table', 'json', 'csv'] as const, default: 'table' }),
  } satisfies FlagsSchema;

  async handle(ctx: DbContext, { flags, args }: Parsed<typeof QueryCommand>) {
    const result = await ctx.db.query(args.sql);

    if (flags.format === 'json') {
      this.logger.info(JSON.stringify(result.rows, null, 2));
    } else if (flags.format === 'csv') {
      const headers = Object.keys(result.rows[0] ?? {}).join(',');
      this.logger.info(headers);
      for (const row of result.rows) this.logger.info(Object.values(row).join(','));
    } else {
      this.ux.table(result.rows);
    }

    this.logger.info(`${result.rowCount} rows`);
  }
}
```

---

## Subcommand groups

Use `:` in command names for namespacing and `static group` for help clustering.

`commands/remote/add.ts`:

```typescript
import { Command, Args, Parsed, FlagsSchema } from 'bob-core';

export default class RemoteAddCommand extends Command {
  static command = 'remote:add';
  static group = 'Remote';
  static description = 'Add a remote repository';

  static args = {
    name: Args.string({ required: true }),
    url: Args.string({ required: true }),
  } satisfies FlagsSchema;

  async handle(_ctx, { args }: Parsed<typeof RemoteAddCommand>) {
    this.logger.info(`Added remote ${args.name}: ${args.url}`);
  }
}
```

`commands/remote/list.ts`:

```typescript
import { Command, Flags, Parsed, FlagsSchema } from 'bob-core';

export default class RemoteListCommand extends Command {
  static command = 'remote:list';
  static group = 'Remote';
  static description = 'List remote repositories';

  static flags = {
    verbose: Flags.boolean({ alias: 'v', description: 'Show URLs' }),
  } satisfies FlagsSchema;

  async handle(_ctx, { flags }: Parsed<typeof RemoteListCommand>) {
    for (const r of getRemotes()) {
      this.logger.info(flags.verbose ? `${r.name}\t${r.url}` : r.name);
    }
  }
}
```

---

## Interactive project wizard

```typescript
import { Command } from 'bob-core';
import { writeFileSync, mkdirSync } from 'node:fs';

export default class InitCommand extends Command {
  static command = 'init';
  static description = 'Initialize a new project';

  async handle() {
    this.logger.info('🎨 Project Setup Wizard\n');

    const name = await this.ux.askForInput('Project name:');
    if (!name) return 1;

    const description = await this.ux.askForInput('Description:') ?? '';

    const framework = await this.ux.askForSelect('Framework:', [
      { name: 'React',  value: 'react' },
      { name: 'Vue',    value: 'vue' },
      { name: 'Svelte', value: 'svelte' },
      { name: 'None',   value: 'none' },
    ]);

    const useTs = await this.ux.askForConfirmation('Use TypeScript?', { default: true });

    const features = await this.ux.askForCheckbox('Additional features:', [
      'ESLint', 'Prettier', 'Vitest', 'GitHub Actions',
    ]);

    const pm = await this.ux.askForSelect('Package manager:', ['npm', 'yarn', 'pnpm', 'bun']);

    this.ux.keyValue({
      Name: name,
      Framework: framework ?? '(none)',
      TypeScript: useTs ? 'Yes' : 'No',
      Features: (features ?? []).join(', ') || '(none)',
      'Package manager': pm ?? '',
    });

    if (!(await this.ux.askForConfirmation('Create project?', { default: true }))) {
      this.logger.warn('Cancelled');
      return 1;
    }

    using loader = this.ux.newLoader('Creating project...');
    mkdirSync(`${name}/src`, { recursive: true });
    writeFileSync(`${name}/package.json`, JSON.stringify({ name, description, version: '0.1.0' }, null, 2));
    loader.updateText('Installing dependencies...');
    await new Promise(r => setTimeout(r, 1500));

    this.logger.info(`\n✅ Project ${name} created`);
  }
}
```

---

## REST API client

`context.ts`:

```typescript
export interface ApiContext {
  apiKey: string;
  baseUrl: string;
}
```

`cli.ts`:

```typescript
import { Cli } from 'bob-core';
import type { ApiContext } from './context.js';

const cli = new Cli<ApiContext>({
  ctx: {
    apiKey: process.env.API_KEY ?? '',
    baseUrl: process.env.API_URL ?? 'https://api.example.com',
  },
  name: 'apicli',
  version: '1.0.0',
});

await cli.withCommands('./commands');
const exitCode = await cli.runCommand(process.argv[2], ...process.argv.slice(3));
process.exit(exitCode);
```

`commands/get.ts`:

```typescript
import { Command, Flags, Args, Parsed, FlagsSchema } from 'bob-core';
import type { ApiContext } from '../context.js';

export default class GetCommand extends Command<ApiContext> {
  static command = 'get';
  static description = 'GET request';

  static args = {
    endpoint: Args.string({ required: true }),
  } satisfies FlagsSchema;

  static flags = {
    pretty: Flags.boolean({ alias: 'p', description: 'Pretty-print JSON' }),
  } satisfies FlagsSchema;

  protected async preHandle() {
    if (!this.ctx.apiKey) {
      this.logger.error('API key not set. Set API_KEY environment variable.');
      return 1;
    }
  }

  async handle(ctx: ApiContext, { flags, args }: Parsed<typeof GetCommand>) {
    using loader = this.ux.newLoader('Fetching...');

    const res = await fetch(`${ctx.baseUrl}/${args.endpoint}`, {
      headers: { Authorization: `Bearer ${ctx.apiKey}` },
    });

    if (!res.ok) {
      this.logger.error(`Error ${res.status}: ${res.statusText}`);
      return 1;
    }

    const data = await res.json();
    this.logger.info(flags.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data));
  }
}
```

---

## Next steps

- [Creating Commands](./creating-commands.md)
- [Interactive Prompts](./interactive-prompts.md)
- [Advanced Topics](./advanced.md)
