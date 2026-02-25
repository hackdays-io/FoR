# Repository Guidelines

## Project Structure & Module Organization
This repo is a pnpm-managed monorepo with two workspaces under `packages/`.
- `packages/contract/`: Hardhat-based smart contracts, Solidity sources in `packages/contract/contracts/` and tests alongside as `*.t.sol`.
- `packages/frontend/`: React Router v7 app (Vite + Tailwind) with server/client build output in `packages/frontend/build/`.
- Root config: `pnpm-workspace.yaml`, `biome.json`, and shared toolchain settings.

## Build, Test, and Development Commands
Run these from the repo root unless noted.
- `pnpm install`: install workspace dependencies.
- `pnpm build`: build all packages (as defined in each workspace).
- `pnpm dev`: run dev servers for all packages that define it.
- `pnpm --filter contract build`: compile contracts.
- `pnpm --filter contract test`: run Hardhat tests (Solidity + node:test).
- `pnpm --filter frontend dev`: start the React Router dev server.
- `pnpm --filter frontend build`: produce production build artifacts.
- `pnpm --filter frontend typegen`: generate React Router types.

## Coding Style & Naming Conventions
- Formatting/linting: Biome is the standard (`biome.json`), 2-space indentation.
- TypeScript: prefer explicit types over `any`.
- Solidity: keep tests colocated with contracts and use `*.t.sol` naming (Foundry-compatible).
- File names: use descriptive, domain-aligned names (e.g., `RouterFactory.sol`).

## Testing Guidelines
- Smart contract tests run via Hardhat: `pnpm --filter contract test`.
- Solidity tests live in `packages/contract/contracts/*.t.sol`.
- Node.js integration tests (if present) also run through `hardhat test`.
- For frontend, run `pnpm --filter frontend typegen` as part of change verification.

## Commit & Pull Request Guidelines
- Use Conventional Commit-style messages seen in history: `feat:`, `chore:`, `fix:`, etc.
- PRs should reference a related Issue (`#123`) and include a clear summary of changes.
- Create Issues before PRs; single, standalone PRs are not accepted.
- Consider Draft PRs for work-in-progress and include screenshots for UI changes.

## Communication & Conduct
- Coordination happens in the Hackdays Discord; prefer Issue comments for questions tied to work.
- Follow the Code for Japan code of conduct linked in `CONTRIBUTING.md`.
