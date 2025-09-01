# Repository Guidelines

## Project Structure & Modules
- `frontend/`: Next.js 15 app (App Router) with Tailwind. Source in `frontend/src`; routes in `frontend/src/app`; UI in `frontend/src/components`; contexts in `frontend/src/contexts`.
- `backend/`: Appwrite configuration, schemas, and scripts only. Backend runs on Appwrite (not in this repo). Use this folder as infra-as-docs and CLI provisioning helpers.
- Docs: `PRD.md`, `PRODUCT_BACKLOG.md`, `epics.md` for product context.

## Build, Test, and Dev
- Frontend dev: `cd frontend && npm i && npm run dev` — start local Next.js.
- Frontend build: `cd frontend && npm run build && npm start` — production build and serve.
- Lint: `cd frontend && npm run lint` — Next/ESLint checks.
- Appwrite provisioning (optional): `bash backend/config/setup.sh` — creates DB/collections via Appwrite CLI. Requires `appwrite` installed and correct env.

## Coding Style & Naming
- Indentation: 2 spaces; modern ES modules in the frontend.
- Prettier: `frontend/prettier.config.js` (Tailwind plugin). Format before PRs.
- Components: PascalCase (e.g., `ProfileButton.js`). Route files under `src/app/.../page.js` use lowercase paths.
- Context/hooks: `SomethingContext.js`, `useSomething.js`. Utilities in `frontend/src/utils`.

## Testing Guidelines
- Frontend: add tests under `frontend/src/__tests__` using Jest + React Testing Library; name files `*.test.js`. Aim for key flows (auth, navigation, forms). Consider `npx jest` or add a `test` script.
- Backend: managed by Appwrite; no runtime tests in this repo. If you edit cloud functions, deploy via Appwrite Console or CLI and test there.

## Commit & Pull Requests
- Commits: follow Conventional Commits when possible (e.g., `feat: add practice stats`, `fix(auth): handle session expiry`). Keep changes scoped and clear.
- PRs: include purpose, linked issues, UI screenshots, and test notes. Verify `npm run lint` passes and that no secrets are committed.

## Security & Configuration
- Do not commit secrets. Copy `frontend/.env.example` to `frontend/.env` for local dev. Backend env in production lives in Appwrite; `backend/config/environment.example` is reference only.
- Review `backend/security/permissions.md` and Appwrite rules before changing access.
