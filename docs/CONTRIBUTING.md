# Contributing to Pratikriya AI

Thanks for your interest in contributing!

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your credentials.
4. Start the dev server: `npm run dev`

## Development Standards

- **TypeScript strict mode** — no `any` unless unavoidable and justified.
- **Routing** — file-based TanStack Router; create the route file for every `Link`/`navigate` target in the same change.
- **Server logic** — use `createServerFn` from `@tanstack/react-start`; validate all input with Zod.
- **Styling** — use semantic design tokens from `src/styles.css`; never hardcode color utilities in components.
- **Database** — every new public table needs `GRANT`s, RLS enabled, and policies in the same migration.

## Before Submitting a PR

```bash
npm run lint    # lint
npm test        # unit tests
npm run build   # production build must pass
```

- Keep PRs focused: one feature or fix per PR.
- Describe *what* changed and *why*, with screenshots for UI changes.
- Add or update tests for logic changes (see `src/lib/__tests__/`).

## Reporting Issues

Use GitHub Issues with a clear title, steps to reproduce, expected vs. actual behavior, and screenshots where relevant.
