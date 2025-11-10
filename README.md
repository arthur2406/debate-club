# Debate Club Monorepo

This repository is a Node.js workspace that groups the frontend, backend, and shared configuration packages used by the Debate Club project. The workspace uses npm workspaces so dependencies are installed once at the repository root while each package keeps its own scripts.

## Project Structure

```
packages/
  backend/            # Node server utilities
  frontend/           # UI layer helpers
  shared/config/      # Centralized lint, format, and test configuration
```

## Getting Started

1. Install dependencies for all workspaces:
   ```bash
   npm install
   ```
2. Run the continuous integration helpers locally:
   ```bash
   npm run ci
   ```

## Package Commands

Each package exposes the same set of npm scripts for a consistent developer experience:

| Script | Description |
| --- | --- |
| `npm run lint --workspace <name>` | Lints source files in the selected workspace. |
| `npm run test --workspace <name>` | Executes the Jest test suite for that workspace. |
| `npm run format --workspace <name>` | Checks that files are formatted with Prettier. |
| `npm run format:write --workspace <name>` | Applies Prettier formatting to the workspace. |

For example, to run the backend tests:

```bash
npm run test --workspace @debate-club/backend
```

The root `npm run ci` command will lint, test, and format-check every workspace in sequence.

## Shared Configuration

Linting, formatting, and Jest settings live in `packages/shared/config`. The frontend and backend workspaces consume these shared files through their local `.eslintrc.cjs`, `.prettierrc.cjs`, and `jest.config.cjs` files to ensure identical tooling across the codebase.
