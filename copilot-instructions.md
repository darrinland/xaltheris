
# Copilot Instructions — Xaltheris (cleaned)

Brief: This file records how Copilot should assist on the Xaltheris prototype. Fill, edit, or accept defaults. If a field is blank, Copilot will follow the suggestions in the "Defaults & best practices" section unless you request otherwise.

## Project overview
- **Project name:** Xaltheris
- **Purpose:** A simple local-play version of a boardgame prototype.
- **Stack:** TypeScript + Angular

## Key goals for Copilot
- **Primary goals (top 3):**
  1. Simple, clean UI
  2. Rules implemented clearly and easily modified
  3. Easy to extend with new features
- **When generating code (if unspecified):** conservative refactor (minimal, safe changes by default)

## Testing (user-specified)
- **Required for new code:** unit tests
- **Preferred framework:** Jest
- **Mocks:** mocks and stubs are acceptable

## Defaults & best practices (recommendations you can accept)
- **Formatting & style:** Use Prettier + ESLint; enable format-on-save. camelCase for variables, PascalCase for types/components, prefer TSDoc for public APIs.
- **Tests & CI:** Use Jest + Testing Library for unit tests. Require tests for behavioral changes and a coverage gate for changed files (suggest 80%).
- **Dependencies & licensing:** Do not add dependencies without approval. Prefer permissive licenses (MIT/BSD). Run license checks in CI.
- **Secrets & security:** Never commit secrets. Use `.env` locally and CI environment variables. Add pre-commit checks (e.g., git-secrets).
- **Commits & PRs:** Branches like `feature/<short-desc>`. Use imperative commit messages. Keep PRs small; require passing CI and one reviewer before merge.
- **Local commands (common):**
  - `npm install`
  - `npm run start`
  - `npm test`
- **CI recommendation:** GitHub Actions with steps: install, lint, test, build.
- **Error handling & logging:** Centralized logger with levels; throw on unexpected errors and return predictable error objects for validation failures.
- **Accessibility:** Prioritize keyboard navigation and ARIA; run `axe-core` checks for core user flows in CI.
- **Performance:** Lazy-load feature modules, minimize third-party libs, and monitor bundle size in CI.
- **Avoid:** `eval`, unapproved dependencies, committing secrets, and very large refactors in a single PR.
- **Response style for Copilot:** For small edits, provide minimal diffs; for new features, provide full files plus brief bullet explanations. Tone: concise and friendly.
- **Runtimes & environments:** Target Node LTS (18+), TypeScript compatible with the Angular version, macOS dev and Linux CI, modern evergreen browsers.
- **Acceptance criteria:** Unit tests for behavior changes, lint passes, CI green, and at least one reviewer approval.

## How to use this file
- Edit the filled fields above if you want specific overrides.
- To make adjustments permanent, copy the relevant bullets into the questionnaire fields or tell Copilot which defaults to apply.

## Next steps (suggested)
- Decide the preferred code-generation mode (minimal / conservative / full feature).
- Confirm formatter and lint config (Prettier/ESLint) to commit into the repo.
- Optionally add a CI workflow that enforces lint and tests.

(End of file)

---

## Suggested best practices (fill or accept)

- **Code style & formatting:** Use Prettier + ESLint integrated with the repo; enable format-on-save. Follow camelCase for variables, PascalCase for types/components, avoid Hungarian prefixes.
- **Testing:** Use Jest + Testing Library for unit tests; require unit tests for new features and a coverage gate (e.g., 80% for changed files).
- **Dependencies & licensing:** Do not add new third-party dependencies without approval; prefer permissive licenses (MIT/BSD) and run license checks on CI.
- **Secrets & security:** Never commit secrets. Use `.env` for local development, CI environment variables for pipelines, and add a pre-commit check (git-secrets or similar).
- **Commits & PRs:** Branches `feature/<short-desc>`, commit messages in imperative mood, small PRs, require at least one reviewer and passing CI before merge.
- **CI / local commands:** Typical commands: `npm install`, `npm run start`, `npm test`. Recommend GitHub Actions for CI with steps: install, lint, test, build.
- **Error handling & logging:** Prefer a centralized logger (levels: debug/info/warn/error); throw for unexpected failures and return predictable error objects for expected validation errors.
- **Accessibility & UX:** Prioritize keyboard navigation and ARIA attributes; run `axe-core` checks during CI for core paths.
- **Performance:** Lazy-load feature modules, minimize third-party libs, set a simple bundle size budget and monitor in CI.
- **What NOT to do:** Don't use `eval`, avoid large refactors in a single PR, and don't add secrets or unapproved dependencies.
- **Response style for Copilot:** Provide minimal diffs for small changes, full files for new features, plus brief bullet-point explanations. Tone: concise and friendly.
- **Default runtimes:** Target Node LTS (18+), TypeScript latest compatible with Angular version, and modern evergreen browsers; assume macOS dev and Linux CI.
- **Acceptance criteria:** Unit tests added for behavior changes, lint passes, CI green, and at least one reviewer approval.

(You can accept these suggestions as-is or edit them into the questionnaire above.)
