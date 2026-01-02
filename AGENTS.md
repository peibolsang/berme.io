# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js App Router project.
- `app/` contains route modules and layouts (e.g., `app/page.tsx`, `app/layout.tsx`) and global styles in `app/globals.css`.
- `public/` stores static assets served at the site root.
- Config lives at the top level: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, and `postcss.config.mjs`.

## Build, Test, and Development Commands
Use npm scripts from `package.json`:
- `npm run dev` starts the local dev server on `http://localhost:3000`.
- `npm run build` creates the production build.
- `npm run start` serves the production build locally (run after `build`).
- `npm run lint` runs ESLint for code quality checks.

## Coding Style & Naming Conventions
Follow existing patterns in the `app/` directory:
- Use TypeScript for components and routes (`.tsx`).
- Match the file-based routing names (`page.tsx`, `layout.tsx`).
- Keep styling in `app/globals.css` and prefer Tailwind utility classes where appropriate.
- Formatting is enforced by ESLint; run `npm run lint` before pushing.

## Testing Guidelines
No test framework is currently configured. If you add tests, document the runner and add a script to `package.json`. Prefer colocated tests under `app/` or a top-level `tests/` directory, with names like `*.test.tsx`.

## Commit & Pull Request Guidelines
There is no established commit convention yet (only the initial scaffold commit exists). Use short, imperative messages (e.g., "Add hero section"). For pull requests:
- Include a concise summary of changes and rationale.
- Add screenshots or recordings for UI changes.
- Note any manual test steps (e.g., `npm run lint`, `npm run dev`).

## Security & Configuration Tips
Store secrets in environment files (e.g., `.env.local`) and avoid committing them. Update `next.config.ts` only when project-level behavior changes.
