# Help System

BOB Core automatically generates beautiful help documentation for your CLI and commands.

## Built-in Help Command

The `help` command is automatically registered and displays all available commands.

```bash
# Show all commands
node cli.js help

# Show help for specific command
node cli.js help deploy

# Alternative syntax
node cli.js deploy --help
node cli.js deploy -h
```

## CLI-Level Help

Configure CLI metadata for the help header:

```typescript
import { Cli } from 'bob-core';

const cli = new Cli({
  name: 'my-app',
  version: '1.0.0'
});
```

Output:
```
my-app 1.0.0

Usage:
  command [options] [arguments]

Available commands:
  ...
```

## Command Help

### Adding Descriptions

**Modern Commands:**
```typescript
export default new Command('deploy', {
  description: 'Deploy application to production'
}).handler(() => {
  // ...
});
```

**Signature-Based Commands:**
```typescript
export default class DeployCommand extends CommandWithSignature {
  signature = 'deploy';
  description = 'Deploy application to production';

  protected async handle() {
    // ...
  }
}
```

### Argument and Option Descriptions

**Modern Commands:**
```typescript
export default new Command('deploy', {
  description: 'Deploy application',
  arguments: {
    environment: {
      type: 'string',
      description: 'Target environment (dev, staging, prod)'
    }
  },
  options: {
    force: {
      type: 'boolean',
      default: false,
      description: 'Skip confirmation prompts'
    },
    region: {
      type: 'string',
      default: 'us-east-1',
      description: 'AWS region for deployment'
    }
  }
});
```

**Signature-Based Commands:**
```typescript
export default class DeployCommand extends CommandWithSignature {
  signature = 'deploy {environment} {--force} {--region=us-east-1}';
  description = 'Deploy application';

  helperDefinitions = {
    environment: 'Target environment (dev, staging, prod)',
    '--force': 'Skip confirmation prompts',
    '--region': 'AWS region for deployment'
  };
}
```

## Help Output Format

### Command-Specific Help

When running `node cli.js deploy --help`:

```
Description:
  Deploy application

Usage:
  deploy <environment> [options]

Arguments:
  environment           Target environment (dev, staging, prod)

Options:
  --force              Skip confirmation prompts (boolean) [default: false]
  --region             AWS region for deployment (string) [default: us-east-1]
  --help, -h           Display help for the given command (boolean)

Examples:
  Deploy to production

    node cli.js deploy prod

  Deploy to staging with custom region

    node cli.js deploy staging --region=eu-west-1
```

### List All Commands

When running `node cli.js help`:

```
my-app 1.0.0

Usage:
  command [options] [arguments]

Available commands:
  help              Show help
  deploy            Deploy application

Database:
  db:migrate        Run database migrations
  db:seed           Seed database with test data

Cache:
  cache:clear       Clear application cache
```

## Adding Examples

Provide usage examples for your commands.

**Modern Commands:**
```typescript
export default new Command('deploy', {
  description: 'Deploy application',
  // ... arguments and options
}).handler(() => {
  // ...
});

// Add examples via commandsExamples property
// Note: This is currently only supported in signature-based commands
// For modern commands, examples are shown based on usage
```

**Signature-Based Commands:**
```typescript
export default class DeployCommand extends CommandWithSignature {
  signature = 'deploy {environment} {--region=us-east-1}';
  description = 'Deploy application';

  commandsExamples = [
    {
      command: 'deploy prod',
      description: 'Deploy to production'
    },
    {
      command: 'deploy staging --region=eu-west-1',
      description: 'Deploy to staging in EU region'
    },
    {
      command: 'deploy dev --force',
      description: 'Force deploy to development'
    }
  ];

  protected async handle() {
    // ...
  }
}
```

## Help Option

The `--help` (or `-h`) option is automatically added to all commands.

```bash
# All these work
node cli.js deploy --help
node cli.js deploy -h
node cli.js help deploy
```

## Grouped Commands

Commands with `:` in their name are automatically grouped:

```typescript
// commands/db/migrate.ts
export default new Command('db:migrate', {
  description: 'Run migrations',
  group: 'Database'
});

// commands/db/seed.ts
export default new Command('db:seed', {
  description: 'Seed database',
  group: 'Database'
});

// commands/cache/clear.ts
export default new Command('cache:clear', {
  description: 'Clear cache',
  group: 'Cache'
});
```

Help output:
```
Available commands:

Database:
  db:migrate        Run migrations
  db:seed           Seed database

Cache:
  cache:clear       Clear cache
```

## Customizing Help Display

### Custom Help Command

Extend the built-in HelpCommand:

```typescript
import { HelpCommand, HelpCommandOptions } from 'bob-core';

class CustomHelpCommand extends HelpCommand {
  constructor(opts: HelpCommandOptions) {
    super(opts);
  }

  // Override methods to customize display
  protected async displayAllCommands() {
    // Custom implementation
  }

  protected async displayCommandHelp(commandName: string) {
    // Custom implementation
  }
}

class MyCli extends Cli {
  protected newHelpCommand(opts: HelpCommandOptions) {
    return new CustomHelpCommand(opts);
  }
}
```

### Hiding Commands from Help

Currently not directly supported, but you can filter in custom help command:

```typescript
// Don't include commands starting with underscore
const visibleCommands = commands.filter(cmd => !cmd.command.startsWith('_'));
```

## Argument Display

Arguments are shown with indicators:

- `<required>` - Required argument
- `[optional]` - Optional argument
- `[variadic...]` - Variadic argument
- `[arg=default]` - With default value

## Option Display

Options show:
- Name and aliases: `--verbose, -v`
- Type: `(boolean)`, `(string)`, `(number)`, `(array)`
- Default value: `[default: false]`
- Description

Example:
```
Options:
  --verbose, -v        Enable verbose logging (boolean) [default: false]
  --output, -o         Output file path (string) [default: null]
  --tags               Filter by tags (array) [default: []]
```

## Best Practices

1. **Always Add Descriptions** - Both command and parameter descriptions
2. **Use Clear Language** - Describe what the command does, not how it works
3. **Provide Examples** - Show common use cases
4. **Group Related Commands** - Use `:` separator for logical organization
5. **Document Aliases** - Show short flags in descriptions
6. **Explain Defaults** - Make default behavior clear
7. **Show Expected Values** - Indicate valid values or formats

## Complete Example

```typescript
export default class BackupCommand extends CommandWithSignature {
  signature = 'backup {database} {--compress} {--output=} {--format=sql|json}';
  description = 'Create a database backup';

  helperDefinitions = {
    database: 'Database name to backup',
    '--compress': 'Compress the backup file',
    '--output': 'Output file path (default: ./backups/)',
    '--format': 'Backup format: sql or json'
  };

  commandsExamples = [
    {
      command: 'backup mydb',
      description: 'Simple backup to default location'
    },
    {
      command: 'backup mydb --compress --output=/var/backups/',
      description: 'Compressed backup to custom location'
    },
    {
      command: 'backup mydb --format=json',
      description: 'Export as JSON instead of SQL'
    }
  ];

  protected async handle() {
    // Implementation
  }
}
```

Help output:
```
Description:
  Create a database backup

Usage:
  backup <database> [options]

Arguments:
  database              Database name to backup

Options:
  --compress           Compress the backup file (boolean) [default: false]
  --output             Output file path (default: ./backups/) (string)
  --format             Backup format: sql or json (string)
  --help, -h           Display help for the given command (boolean)

Examples:
  Simple backup to default location

    node cli.js backup mydb

  Compressed backup to custom location

    node cli.js backup mydb --compress --output=/var/backups/

  Export as JSON instead of SQL

    node cli.js backup mydb --format=json
```

## Next Steps

- [API Reference](./api-reference.md) - Complete API documentation
- [Examples](./examples.md) - Real-world CLI examples
