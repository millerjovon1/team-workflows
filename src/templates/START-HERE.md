# START HERE

Welcome to this project! This repo uses **team-workflows** for a safe, consistent development flow.

## Quick Reference

| Step | Command | What It Does |
|------|---------|--------------|
| 1 | `npm run wf:help` | Show all workflow commands |
| 2 | `npm run wf:start` | Create a feature branch from the default branch |
| 3 | *(write your code)* | Build your feature |
| 4 | `npm run wf:check` | Verify repo state, run build & lint |
| 5 | `npm run wf:staging` | Merge into staging and push |
| 6 | `npm run wf:production` | Merge into production (with confirmation) |
| -- | `npm run wf:netlify` | Inspect repo and print Netlify config |

## Workflow Rules

- **Never force push.** All pushes are safe, standard pushes.
- **Never auto-merge.** Production merges require explicit confirmation.
- **Always branch.** Work on feature branches, not directly on main.
- **Always check.** Run `wf:check` before pushing to catch issues early.

## Branch Strategy

```
main (production)
 └── staging (preview/QA)
      └── feat/your-feature (development)
```

1. Create a feature branch from `main`
2. Push to staging for preview/testing
3. Merge to `main` for production release

## Files Added by team-workflows

| File | Purpose |
|------|---------|
| `netlify.toml` | Netlify build configuration |
| `.vscode/tasks.json` | VS Code task runner integration |
| `.github/workflows/staging.yml` | GitHub Actions for staging deploys |
| `.github/workflows/production.yml` | GitHub Actions for production deploys |
| `START-HERE.md` | This file |

## Need Help?

Run `npm run wf:help` at any time to see all available commands.
