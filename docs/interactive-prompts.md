# Interactive Prompts

Interactive prompts and display utilities are provided by the `UX` class, exposed inside every command as `this.ux`. Prompts are powered by [`@inquirer/prompts`](https://www.npmjs.com/package/@inquirer/prompts).

```typescript
import { Command, Parsed } from 'bob-core';

export default class SetupCommand extends Command {
  static command = 'setup';
  static description = 'Interactive project setup';

  async handle() {
    const name = await this.ux.askForInput('Project name:');
    const lang = await this.ux.askForSelect('Language:', ['TypeScript', 'JavaScript']);
    const ok = await this.ux.askForConfirmation('Continue?');
    if (!ok) return 1;

    using loader = this.ux.newLoader('Creating project...');
    await createProject({ name, lang });
  }
}
```

> All prompt methods return `Promise<T | null>`. They resolve to `null` when the user cancels (Ctrl+C). Always check.

## Standalone usage

The same functions are exported standalone for use outside of a command class:

```typescript
import { askForInput, askForSelect, newLoader } from 'bob-core';
```

## Text input

### `askForInput(message, opts?)`

```typescript
const name = await this.ux.askForInput('Your name:');
const name = await this.ux.askForInput('Your name:', { default: 'Anonymous' });
```

### `askForPassword(message, opts?)`

Masked input for secrets.

```typescript
const password = await this.ux.askForPassword('Password:');
```

### `askForNumber(message, opts?)`

```typescript
const age = await this.ux.askForNumber('Age:', { min: 0, max: 120 });
```

### `askForEditor(message, opts?)`

Opens `$EDITOR` for multi-line input.

```typescript
const description = await this.ux.askForEditor('Long description:');
```

## Selection

### `askForSelect(message, choices, opts?)`

Single choice from a list. Choices can be strings or `{ name, value, description? }` objects.

```typescript
const env = await this.ux.askForSelect('Environment:', ['dev', 'staging', 'prod']);

const framework = await this.ux.askForSelect('Framework:', [
  { name: 'React', value: 'react', description: 'A library for UIs' },
  { name: 'Vue', value: 'vue' },
]);
```

### `askForCheckbox(message, choices, opts?)`

Multi-select. Returns an array.

```typescript
const features = await this.ux.askForCheckbox('Features:', [
  'TypeScript', 'ESLint', 'Prettier', 'Vitest',
]);
```

### `askForSearch(message, source, opts?)`

Searchable single-select. `source` is an async function returning matches for the current input.

```typescript
const country = await this.ux.askForSearch('Country:', async (term) => {
  return countries.filter(c => c.name.toLowerCase().includes(term.toLowerCase()));
});
```

### `askForRawList(message, choices, opts?)`

Numbered/keyed list. Each choice has a `key`.

```typescript
const action = await this.ux.askForRawList('Action:', [
  { key: 'a', name: 'Add', value: 'add' },
  { key: 'r', name: 'Remove', value: 'remove' },
]);
```

### `askForExpand(message, choices, opts?)`

Single-key expandable prompt (think `git add -p`).

```typescript
const choice = await this.ux.askForExpand('Apply patch?', [
  { key: 'y', name: 'Yes', value: 'yes' },
  { key: 'n', name: 'No', value: 'no' },
  { key: 's', name: 'Skip', value: 'skip' },
]);
```

## Confirmation & toggles

### `askForConfirmation(message?, opts?)`

```typescript
const ok = await this.ux.askForConfirmation('Continue?');
const force = await this.ux.askForConfirmation('Overwrite?', { default: false });
```

### `askForToggle(message, opts?)`

Binary toggle with custom labels.

```typescript
const dark = await this.ux.askForToggle('Dark mode?', { active: 'Yes', inactive: 'No' });
```

## Lists

### `askForList(message, opts?)`

Comma-separated input parsed into an array.

```typescript
const tags = await this.ux.askForList('Tags (comma-separated):');
// "urgent, bug, frontend" → ['urgent', 'bug', 'frontend']
```

## Files & directories

```typescript
const file = await this.ux.askForFile('Config file:');
const dir  = await this.ux.askForDirectory('Output directory:');
const path = await this.ux.askForFileSelector('Pick something:'); // either
```

## Display utilities

### `keyValue(pairs, opts?)`

Aligned key-value listing.

```typescript
this.ux.keyValue({
  Name: 'my-project',
  Version: '1.0.0',
  Author: 'Leo',
});
```

### `table(data, columns?)`

Render an array of objects as a table.

```typescript
this.ux.table([
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob',   role: 'user'  },
]);

// With explicit columns
this.ux.table(users, [
  { key: 'id',   header: 'ID',   align: 'right' },
  { key: 'name', header: 'Name' },
]);
```

### `newProgressBar(total, opts?)`

```typescript
const bar = this.ux.newProgressBar(100);
for (let i = 0; i < 100; i++) {
  await doStep();
  bar.tick();
}
bar.stop();
```

### `newLoader(text?, chars?, delay?)`

Animated spinner. Use `using` for automatic cleanup on scope exit.

```typescript
using loader = this.ux.newLoader('Downloading...');
await download();
loader.updateText('Extracting...');
await extract();
// auto-stops at end of scope

// Or manually:
const l = this.ux.newLoader('Working');
await work();
l.stop();
```

## Handling cancellation

All `ask*` prompts return `null` when the user cancels (Ctrl+C / Esc). Always handle it:

```typescript
const name = await this.ux.askForInput('Your name:');
if (name === null) {
  this.logger.warn('Cancelled');
  return 1;
}
```

For lower-level control, the `withCancelHandling` helper is exported for wrapping prompt promises.

## Complete example

```typescript
import { Command } from 'bob-core';

export default class InitCommand extends Command {
  static command = 'init';
  static description = 'Initialize a new project';

  async handle() {
    const name = await this.ux.askForInput('Project name:');
    if (!name) return 1;

    const framework = await this.ux.askForSelect('Framework:', [
      { name: 'React',  value: 'react' },
      { name: 'Vue',    value: 'vue' },
      { name: 'Svelte', value: 'svelte' },
    ]);

    const features = await this.ux.askForCheckbox('Features:',
      ['TypeScript', 'ESLint', 'Prettier', 'Vitest']);

    this.ux.keyValue({ Name: name, Framework: framework, Features: (features ?? []).join(', ') });

    if (!(await this.ux.askForConfirmation('Create project?'))) return 1;

    using loader = this.ux.newLoader('Creating project...');
    await createProject({ name, framework, features });

    this.logger.info(`✅ ${name} created`);
  }
}
```

## Next steps

- [Advanced Topics](./advanced.md)
- [Examples](./examples.md)
- [API Reference](./api-reference.md)
