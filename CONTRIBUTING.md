# Contributing to git-wrapped

Thanks for helping! 🎁

## Setup

```bash
git clone <your-fork-url> && cd git-wrapped
npm test
node bin/git-wrapped.js          # run it in any git repo
```

No dependencies to install: the project is intentionally zero-dependency.

## Project layout

| File | Role |
|---|---|
| `src/git.js` | Reads `git log` |
| `src/github.js` | GitHub mode (GraphQL API) |
| `src/stats.js` | Turns commits into stats |
| `src/archetypes.js` | Developer personalities |
| `src/terminal.js` | Terminal rendering |
| `src/html.js` | Browser story and share card |

## Good first contributions

- **Add a personality** in `src/archetypes.js` (a score function and a palette)
- **Add a language** to the `LANGS` map in `src/stats.js`
- **Add a fun stat** and show it in both the terminal and the story
- **Translate** the story into your language

Please add a test in `test/` for new stats, and keep the project dependency-free.
