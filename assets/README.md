# Assets

## Logo

`logo.svg` — Hexagonal hive with three agent nodes (C = Claude, G = Gemini, X = Codex).

Use in README:
```markdown
<p align="center">
  <img src="assets/logo.svg" width="120" alt="agents-hive logo">
</p>
```

## Banner

TODO: Create a wide banner image (1280x640) for GitHub social preview.

Suggested design:
- Dark background with hexagonal grid pattern
- "agents-hive" text in center
- Three colored dots representing agents
- Tagline: "Multi-agent workspace manager"

## Demo GIF

Record a demo using [asciinema](https://asciinema.org/) or [vhs](https://github.com/charmbracelet/vhs):

```bash
# Using vhs (recommended)
vhs docs/demo.tape

# Using asciinema
asciinema rec demo.cast
# Then convert: agg demo.cast demo.gif
```

### Suggested demo flow:

```
hive init /tmp/demo
export HIVE_WORKSPACE=/tmp/demo
hive project create api claude "REST API"
hive project create blog gemini "Blog automation"
hive project list
hive memo api "Using Express + TypeScript"
hive memo api
hive cron add tests '*/30 * * * *' 'cd $HIVE_WORKSPACE/api && claude -p "npm test"'
hive cron list
hive status
hive briefing
```

### VHS tape file (docs/demo.tape):

```tape
Output demo.gif
Set FontSize 14
Set Width 900
Set Height 500
Set Theme "Catppuccin Mocha"

Type "hive init /tmp/demo"
Enter
Sleep 1s

Type "export HIVE_WORKSPACE=/tmp/demo"
Enter
Sleep 500ms

Type 'hive project create api claude "REST API server"'
Enter
Sleep 1s

Type 'hive project create blog gemini "Blog automation"'
Enter
Sleep 1s

Type "hive project list"
Enter
Sleep 1.5s

Type 'hive memo api "Express + TypeScript, PostgreSQL"'
Enter
Sleep 1s

Type "hive status"
Enter
Sleep 2s

Type "hive help"
Enter
Sleep 3s
```
