# Examples

Real-world examples of CLI applications built with BOB Core.

## Table of Contents

- [Simple File Manager](#simple-file-manager)
- [Database CLI](#database-cli)
- [Git-like CLI with Subcommands](#git-like-cli-with-subcommands)
- [Interactive Project Wizard](#interactive-project-wizard)
- [REST API Client](#rest-api-client)

---

## Simple File Manager

A basic file management CLI.

**cli.ts:**
```typescript
import { Cli } from 'bob-core';

const cli = new Cli({
  name: 'filemanager',
  version: '1.0.0'
});

await cli.withCommands('./commands');

const exitCode = await cli.runCommand(
  process.argv[2],
  ...process.argv.slice(3)
);

process.exit(exitCode);
```

**commands/copy.ts:**
```typescript
import { Command } from 'bob-core';
import { copyFileSync } from 'fs';

export default new Command('copy', {
  description: 'Copy a file',
  arguments: {
    source: 'string',
    destination: 'string'
  },
  options: {
    overwrite: {
      type: 'boolean',
      default: false,
      description: 'Overwrite if destination exists'
    }
  }
}).handler(async (ctx, { arguments: args, options }) => {
  try {
    if (!options.overwrite && existsSync(args.destination)) {
      const confirmed = await this.io.askForConfirmation(
        `${args.destination} exists. Overwrite?`
      );
      if (!confirmed) return 1;
    }

    copyFileSync(args.source, args.destination);
    this.io.info(`Copied ${args.source} to ${args.destination}`);
    return 0;
  } catch (error) {
    this.io.error(`Error: ${error.message}`);
    return 1;
  }
});
```

**commands/list.ts:**
```typescript
import { Command } from 'bob-core';
import { readdirSync } from 'fs';

export default new Command('list', {
  description: 'List files in directory',
  arguments: {
    path: {
      type: 'string',
      default: '.',
      required: false
    }
  }
}).handler((ctx, { arguments: args }) => {
  const files = readdirSync(args.path);
  files.forEach(file => this.io.log(file));
});
```

---

## Database CLI

CLI for database operations with context injection.

**context.ts:**
```typescript
import { Client } from 'pg';

export interface DatabaseContext {
  db: Client;
  config: {
    host: string;
    port: number;
    database: string;
  };
}
```

**cli.ts:**
```typescript
import { Cli } from 'bob-core';
import { Client } from 'pg';
import { DatabaseContext } from './context';

const db = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

await db.connect();

const context: DatabaseContext = {
  db,
  config: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME!
  }
};

const cli = new Cli<DatabaseContext>({
  ctx: context,
  name: 'dbcli',
  version: '1.0.0'
});

await cli.withCommands('./commands');

const exitCode = await cli.runCommand(
  process.argv[2],
  ...process.argv.slice(3)
);

await db.end();
process.exit(exitCode);
```

**commands/query.ts:**
```typescript
import { Command } from 'bob-core';
import { DatabaseContext } from '../context';

export default new Command<DatabaseContext>('query', {
  description: 'Execute SQL query',
  arguments: {
    sql: 'string'
  },
  options: {
    format: {
      type: 'string',
      default: 'table',
      description: 'Output format (table, json, csv)'
    }
  }
}).handler(async (ctx, { arguments: args, options }) => {
  try {
    const result = await ctx.db.query(args.sql);

    if (options.format === 'json') {
      this.io.log(JSON.stringify(result.rows, null, 2));
    } else if (options.format === 'csv') {
      // CSV output
      const headers = Object.keys(result.rows[0] || {}).join(',');
      this.io.log(headers);
      result.rows.forEach(row => {
        this.io.log(Object.values(row).join(','));
      });
    } else {
      // Table format
      console.table(result.rows);
    }

    this.io.info(`${result.rowCount} rows`);
  } catch (error) {
    this.io.error(`Query failed: ${error.message}`);
    return 1;
  }
});
```

**commands/migrate.ts:**
```typescript
import { CommandWithSignature } from 'bob-core';
import { DatabaseContext } from '../context';
import { readFileSync } from 'fs';

export default class MigrateCommand extends CommandWithSignature<DatabaseContext> {
  signature = 'migrate {file} {--rollback}';
  description = 'Run database migration';

  protected async handle() {
    const file = this.argument<string>('file');
    const rollback = this.option<boolean>('rollback');

    const sql = readFileSync(file, 'utf-8');

    using loader = this.newLoader(
      rollback ? 'Rolling back...' : 'Migrating...'
    );

    try {
      await this.ctx.db.query('BEGIN');
      await this.ctx.db.query(sql);
      await this.ctx.db.query('COMMIT');

      this.io.info(`Migration ${rollback ? 'rolled back' : 'completed'}`);
    } catch (error) {
      await this.ctx.db.query('ROLLBACK');
      this.io.error(`Migration failed: ${error.message}`);
      return 1;
    }
  }
}
```

---

## Git-like CLI with Subcommands

Organize commands with namespaces.

**commands/remote/add.ts:**
```typescript
import { Command } from 'bob-core';

export default new Command('remote:add', {
  description: 'Add a remote repository',
  group: 'Remote',
  arguments: {
    name: 'string',
    url: 'string'
  }
}).handler((ctx, { arguments: args }) => {
  // Add remote logic
  this.io.info(`Added remote ${args.name}: ${args.url}`);
});
```

**commands/remote/list.ts:**
```typescript
import { Command } from 'bob-core';

export default new Command('remote:list', {
  description: 'List remote repositories',
  group: 'Remote',
  options: {
    verbose: {
      type: 'boolean',
      alias: ['v'],
      default: false,
      description: 'Show URLs'
    }
  }
}).handler((ctx, { options }) => {
  const remotes = getRemotes();

  remotes.forEach(remote => {
    if (options.verbose) {
      this.io.log(`${remote.name}\t${remote.url}`);
    } else {
      this.io.log(remote.name);
    }
  });
});
```

**commands/branch/create.ts:**
```typescript
import { Command } from 'bob-core';

export default new Command('branch:create', {
  description: 'Create a new branch',
  group: 'Branch',
  arguments: {
    name: 'string'
  },
  options: {
    checkout: {
      type: 'boolean',
      alias: ['c'],
      default: false,
      description: 'Check out the new branch'
    }
  }
}).handler((ctx, { arguments: args, options }) => {
  // Branch creation logic
  this.io.info(`Created branch ${args.name}`);

  if (options.checkout) {
    this.io.info(`Switched to branch ${args.name}`);
  }
});
```

---

## Interactive Project Wizard

Build an interactive setup wizard.

```typescript
import { Command } from 'bob-core';
import { writeFileSync, mkdirSync } from 'fs';

export default new Command('init', {
  description: 'Initialize a new project'
}).handler(async () => {
  this.io.info('🎨 Project Setup Wizard\n');

  // Project name
  const name = await this.io.askForInput(
    'Project name:',
    undefined,
    {
      validate: (value: string) => {
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Name must contain only lowercase letters, numbers, and hyphens';
        }
        return true;
      }
    }
  );

  if (!name) return 1;

  // Description
  const description = await this.io.askForInput('Description:', '');

  // Framework selection
  const framework = await this.io.askForSelect(
    'Choose a framework:',
    [
      { title: 'React', value: 'react', description: 'A library for building UIs' },
      { title: 'Vue', value: 'vue', description: 'The Progressive Framework' },
      { title: 'Svelte', value: 'svelte', description: 'Cybernetically enhanced apps' },
      { title: 'None', value: 'none', description: 'Vanilla JavaScript' }
    ]
  );

  // TypeScript
  const useTypeScript = await this.io.askForConfirmation(
    'Use TypeScript?',
    true
  );

  // Features
  const features = await this.io.askForSelect(
    'Select additional features:',
    ['ESLint', 'Prettier', 'Testing (Vitest)', 'CI/CD (GitHub Actions)'],
    { type: 'multiselect' }
  );

  // Package manager
  const packageManager = await this.io.askForSelect(
    'Package manager:',
    ['npm', 'yarn', 'pnpm', 'bun']
  );

  // Confirmation
  this.io.log('\n📋 Project Configuration:');
  this.io.log(`  Name: ${name}`);
  this.io.log(`  Framework: ${framework}`);
  this.io.log(`  TypeScript: ${useTypeScript ? 'Yes' : 'No'}`);
  this.io.log(`  Features: ${features?.join(', ') || 'None'}`);
  this.io.log(`  Package Manager: ${packageManager}\n`);

  const confirmed = await this.io.askForConfirmation('Create project?', true);
  if (!confirmed) {
    this.io.warn('Cancelled');
    return 1;
  }

  // Create project
  using loader = this.newLoader('Creating project...');

  mkdirSync(name, { recursive: true });
  mkdirSync(`${name}/src`, { recursive: true });

  // Generate package.json
  const packageJson = {
    name,
    version: '0.1.0',
    description,
    scripts: {
      dev: 'vite',
      build: 'vite build'
    },
    devDependencies: {}
  };

  writeFileSync(
    `${name}/package.json`,
    JSON.stringify(packageJson, null, 2)
  );

  loader.updateText('Installing dependencies...');

  // Simulate installation
  await new Promise(resolve => setTimeout(resolve, 2000));

  loader.stop();

  this.io.info(`\n✅ Project ${name} created successfully!`);
  this.io.log(`\nNext steps:`);
  this.io.log(`  cd ${name}`);
  this.io.log(`  ${packageManager} run dev`);
});
```

---

## REST API Client

CLI for interacting with a REST API.

**context.ts:**
```typescript
export interface ApiContext {
  apiKey: string;
  baseUrl: string;
}
```

**cli.ts:**
```typescript
import { Cli } from 'bob-core';
import { ApiContext } from './context';

const context: ApiContext = {
  apiKey: process.env.API_KEY || '',
  baseUrl: process.env.API_URL || 'https://api.example.com'
};

const cli = new Cli<ApiContext>({
  ctx: context,
  name: 'apicli',
  version: '1.0.0'
});

await cli.withCommands('./commands');

const exitCode = await cli.runCommand(
  process.argv[2],
  ...process.argv.slice(3)
);

process.exit(exitCode);
```

**commands/get.ts:**
```typescript
import { Command } from 'bob-core';
import { ApiContext } from '../context';

export default new Command<ApiContext>('get', {
  description: 'GET request',
  arguments: {
    endpoint: 'string'
  },
  options: {
    pretty: {
      type: 'boolean',
      alias: ['p'],
      default: false,
      description: 'Pretty print JSON'
    }
  }
})
  .preHandler(async (ctx) => {
    if (!ctx.apiKey) {
      this.io.error('API key not set. Set API_KEY environment variable.');
      return 1;
    }
  })
  .handler(async (ctx, { arguments: args, options }) => {
    using loader = this.newLoader('Fetching...');

    try {
      const response = await fetch(`${ctx.baseUrl}/${args.endpoint}`, {
        headers: {
          'Authorization': `Bearer ${ctx.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      loader.stop();

      if (!response.ok) {
        this.io.error(`Error: ${response.status} ${response.statusText}`);
        return 1;
      }

      const data = await response.json();

      if (options.pretty) {
        this.io.log(JSON.stringify(data, null, 2));
      } else {
        this.io.log(JSON.stringify(data));
      }
    } catch (error) {
      loader.stop();
      this.io.error(`Request failed: ${error.message}`);
      return 1;
    }
  });
```

**commands/post.ts:**
```typescript
import { Command } from 'bob-core';
import { ApiContext } from '../context';

export default new Command<ApiContext>('post', {
  description: 'POST request',
  arguments: {
    endpoint: 'string',
    data: 'string'
  }
})
  .preHandler(async (ctx) => {
    if (!ctx.apiKey) {
      this.io.error('API key not set');
      return 1;
    }
  })
  .handler(async (ctx, { arguments: args }) => {
    let jsonData;
    try {
      jsonData = JSON.parse(args.data);
    } catch {
      this.io.error('Invalid JSON data');
      return 1;
    }

    using loader = this.newLoader('Sending...');

    try {
      const response = await fetch(`${ctx.baseUrl}/${args.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ctx.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      });

      loader.stop();

      const result = await response.json();
      this.io.log(JSON.stringify(result, null, 2));

      return response.ok ? 0 : 1;
    } catch (error) {
      loader.stop();
      this.io.error(`Request failed: ${error.message}`);
      return 1;
    }
  });
```

---

## Next Steps

- [Creating Commands](./creating-commands.md) - Learn command creation patterns
- [Interactive Prompts](./interactive-prompts.md) - Build interactive experiences
- [Advanced Topics](./advanced.md) - Deep dive into advanced features
