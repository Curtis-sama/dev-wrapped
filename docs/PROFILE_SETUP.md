# Put Git Wrapped on your GitHub profile

This guide adds an animated card to your GitHub profile that updates itself every day.

<img src="../assets/card.svg" width="840" alt="Git Wrapped profile card" />

There are two ways to do it:

- [**Let Claude Code do it**](#option-a-let-claude-code-do-it) (2 minutes)
- [**Do it by hand**](#option-b-do-it-by-hand) (5 minutes, no tools needed)

---

## Option A: let Claude Code do it

You need [Claude Code](https://claude.com/claude-code) and the [GitHub CLI](https://cli.github.com) (logged in with `gh auth login`).

**1. Install the plugin**, inside Claude Code:

```
/plugin marketplace add Curtis-sama/dev-wrapped
/plugin install dev-wrapped@dev-wrapped
```

**2. Ask for it:**

```
Put the dev-wrapped card on my GitHub profile
```

Claude creates your profile repository if needed, adds the workflow and the card, runs it once, and gives you the link. It asks before every change it makes on GitHub.

<details>
<summary>Without the plugin system</summary>

Copy the skill into your personal skills folder:

```bash
mkdir -p ~/.claude/skills/dev-wrapped-profile
curl -fsSL https://raw.githubusercontent.com/Curtis-sama/dev-wrapped/main/skills/dev-wrapped-profile/SKILL.md \
  -o ~/.claude/skills/dev-wrapped-profile/SKILL.md
```

</details>

---

## Option B: do it by hand

### 1. Create your profile repository

Your profile README lives in a special repository named **exactly like your username**.

1. Go to [github.com/new](https://github.com/new).
2. Repository name: your username (GitHub says *"You found a secret!"*).
3. Choose **Public** and turn on **Add README**.
4. Click **Create repository**.

Already have one? Skip to step 2.

### 2. Add the workflow

In that repository, click **Add file → Create new file**, name it exactly:

```
.github/workflows/dev-wrapped.yml
```

and paste:

```yaml
name: Git Wrapped
on:
  schedule:
    - cron: '0 6 * * *'   # every day at 06:00 UTC
  workflow_dispatch:       # lets you run it by hand
  push:                    # runs once as soon as you add this file
    paths: ['.github/workflows/dev-wrapped.yml']
permissions:
  contents: write
jobs:
  card:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Curtis-sama/dev-wrapped@v1
        with:
          timezone: Europe/Paris   # your time zone, for accurate coding hours
```

Click **Commit changes**.

### 3. Add the card to your README

Open `README.md`, click the pencil icon, and add:

```markdown
![My Git Wrapped](./dev-wrapped.svg)
```

> **Watch out:** GitHub's default profile README hides most of its text inside `<!--` and `-->`.
> Anything between those markers is invisible, so put the line **above** `<!--`, right under the title.

Commit. The image looks broken for now: the card doesn't exist yet.

### 4. Wait a minute

Adding the workflow file in step 2 already started the first run. Open the **Actions** tab: after about a minute you get a green check, and the card appears on `github.com/<your-username>`.

Nothing in the Actions tab? Click **Git Wrapped → Run workflow → Run workflow** to start it by hand.

---

## Include private contributions

By default the workflow only sees your **public** activity. To count private repositories too:

1. Create a token at [github.com/settings/tokens/new](https://github.com/settings/tokens/new) with the **repo** and **read:user** scopes.
2. In your profile repository, go to **Settings → Secrets and variables → Actions → New repository secret**, name it `GH_PAT` and paste the token.
3. Add one line to the workflow:

```yaml
        with:
          timezone: Europe/Paris
          github_token: ${{ secrets.GH_PAT }}
```

Run the workflow again.

## Options

| Input | Default | Description |
|---|---|---|
| `github_user` | repository owner | Account to wrap |
| `github_token` | `github.token` | A personal access token secret to include private contributions |
| `output` | `dev-wrapped.svg` | Where to write the card |
| `theme` | `auto` | `auto` follows each visitor's light/dark theme; or `dark`, `light` |
| `year` | current year | Year to wrap |
| `timezone` | `UTC` | Time zone for commit hours |
| `commit` | `true` | Commit the card to the repository |

## Troubleshooting

| Problem | Fix |
|---|---|
| The image stays broken | Check the run in the **Actions** tab (step 4), and that the README points to `./dev-wrapped.svg`. |
| The card doesn't show on my profile | The line is probably inside `<!-- -->`. Move it above. |
| The run fails on `git push` (403) | **Settings → Actions → General → Workflow permissions**: choose *Read and write permissions*. |
| Very few commits | Only public activity is counted: see *Include private contributions*. |
