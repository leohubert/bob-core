# Shell completion

Every CLI built on bob-core gets shell completion for free: `Cli` registers a `completion` command
that prints an installable script, and a hidden `__complete` command that the shell calls to resolve
candidates. Nothing to declare — the candidates come from the same static metadata `help` renders.

Only **fish** is implemented today. `CompletionShell` covers `fish | zsh | bash` so the other two are
a renderer each, and `isImplemented()` reports which are real.

## Enabling it

```console
$ mycli completion fish > ~/.config/fish/completions/mycli.fish
```

Pass `binName` when constructing the `Cli` so the generated script calls the right executable — it
defaults to the basename of the running script, which is wrong for a wrapper or a renamed binary:

```typescript
const cli = new Cli({ ctx, name: 'My CLI', version, binName: 'mycli' });
```

The generated script holds no command names of its own. It asks the binary on every keypress, so it
never goes stale and only needs regenerating if the file is deleted.

## What completes

| Position | Candidates |
|---|---|
| First token | command names and aliases, minus `hidden` ones, with descriptions |
| `-` / `--` | the command's flags, including inherited `baseFlags`; short forms on a single dash |
| after a value-taking flag | `Flags.option` values, or a `complete` result |
| `--flag=…` | the same, completed inside the single token |
| positional | the `Args` entry for that position, counting past flags and the values they consume |

Flags already present on the line are dropped, unless `multiple`. Legacy `CommandWithSignature`
commands work too — their signature schema is materialized on demand.

Filename completion is deliberately suppressed, so path-typed arguments do not complete paths yet.

## Dynamic values

A fixed `options` list covers enums. For anything looked up live — a ticket, a branch, a namespace —
declare a `source` and let `Flags.search` wire up both paths at once:

```typescript
const issueId = Flags.search({
  description: 'Linear issue',
  required: true,
  source: async ({ term, ctx, signal }) => {
    const issues = await ctx.linear.searchIssues(undefined, { signal });

    return issues
      .filter(issue => issue.identifier.toLowerCase().startsWith(term.toLowerCase()))
      .map(issue => ({ name: `${issue.identifier} — ${issue.title}`, value: issue.identifier }));
  },
});
```

One source, two consumers: interactively it backs an `askForSearch` prompt when the value is
missing; at the shell it backs completion. Writing `ask` by hand only covers the prompt and leaves
completion blind.

The underlying primitive is `complete` on any flag or argument definition, if you need it directly:

```typescript
Flags.custom<string>({ parse: v => v, complete: async ({ term, ctx, signal }) => [...] })
```

`complete` receives no `ux` — completion runs mid-keystroke and must never prompt or print.

**Two constraints worth knowing.**

*The shell filters too.* fish narrows candidates by the token already typed, so a value the user has
not typed a prefix of never reaches the screen. Matching a ticket's *title* and returning its *ID*
looks right in tests and shows nothing in a terminal. Filter on what the user types.

*There is a deadline.* A resolver gets `timeoutMs` (1500 by default) and an `AbortSignal`; pass the
signal to your network call. Every dynamic failure — no loader, resolver throwing, deadline passing
— degrades to the static candidates. Completion never breaks the prompt.

## Fast startup

`resolveCompletion` takes a plain `CommandSpec[]`, not a live registry, precisely so a host whose
startup is dominated by importing command modules can snapshot the metadata to disk and answer
keypresses without loading anything:

```typescript
const specs = readCache() ?? commandSpecs(await loadEverything());

const candidates = await resolveCompletion({
  specs,
  words,
  ctx,
  // Only invoked when the slot under the cursor is dynamic.
  loadCommand: async name => (await loadEverything()).findCommand(name),
});
```

`commandSpecs` output is JSON-serializable and round-trips exactly. Key the cache on something that
changes when the commands do — a build hash works well.

`__complete` must obey two rules, and the built-in command already does:

1. **Only candidates on stdout.** Anything else is read back by the shell as a suggestion — an
   update banner, a spinner, a stray log line.
2. **Always exit 0.** A completion bug must not paint a stack trace over someone's prompt.

If your entry point prints notices or rebuilds on launch, skip that work for `COMPLETE_COMMAND` and
`COMPLETION_COMMAND` — the latter's stdout gets redirected into a file.

## Adding a shell

1. Write `renderXyzScript` and `encodeXyzCandidates` in `src/completion/xyz.ts`.
2. Add the branches to `renderCompletionScript` / `encodeCandidates` in `src/completion/render.ts`.
3. Add the shell to `IMPLEMENTED_SHELLS`.

The resolution logic in `completeArgv` is dialect-agnostic and already prefix-filters, which fish
does itself but bash and zsh do not.
