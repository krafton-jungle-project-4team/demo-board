---
name: clean-react
description: Clean and improve only the React/frontend code changed on the current branch since its merge-base. Use when asked to create a goal, harden, optimize, doctor, or repeatedly improve branch work with react-doctor, Toss Frontend Fundamentals, and Vercel React Best Practices while deferring pre-existing issues.
---

# Clean React

## Purpose

Improve the current branch's changed React/frontend work without turning the task into a whole-codebase cleanup.

Use the branch's fork point as the boundary. Fix problems caused by this branch; record unrelated existing problems as deferred.

## Goal Behavior

This skill is usually most useful as a goal because the expected outcome is "keep improving until scoped checks pass."

Create a goal before editing when the user explicitly asks for a goal or uses goal-like language such as `goal`, `목표`, `끝까지`, `만족할 때까지`, `반복`, `다 없어질 때까지`, or the default prompt that starts with "Create a goal".

Use this goal objective:

> Improve only the current branch's changed React/frontend work since merge-base until scoped React Doctor, Toss Frontend Fundamentals, Vercel React Best Practices, and `npm run verify` checks pass, or remaining issues are documented as pre-existing or out of scope.

If the user only says to use or run `clean-react` without goal-like wording, run the workflow normally without calling `create_goal`.

## Resolve Scope

1. If the user names a target branch, use it.
2. Otherwise infer a target branch in this order:
   - `origin/main` if it exists
   - `origin/master` if it exists
   - `git symbolic-ref --short refs/remotes/origin/HEAD` if available
   - local `main` or `master`
3. If no target branch is clear, ask one concise question before changing files.
4. Compute `BASE_COMMIT=$(git merge-base HEAD "$TARGET_BRANCH")`.
5. List changed files with `git diff --name-only "$BASE_COMMIT"...HEAD`.
6. If the user gave no explicit scope, prioritize changed React/frontend files under `apps/web-client` and `packages/ui`, especially `*.ts`, `*.tsx`, CSS, and package/config files needed by those changes.

Keep edits inside changed files unless an adjacent file must change to fix this branch's behavior.

## Checks To Use

- React Doctor: use the local `$react-doctor` skill for diff/regression diagnostics instead of duplicating CLI commands here.
- Toss Frontend Fundamentals: apply readability, predictability, cohesion, and coupling checks to changed frontend code.
- Vercel React Best Practices: apply React performance checks, especially re-render, effect, async, rendering, and bundle-size rules.
- Vercel Composition Patterns: use only when component API structure is part of the problem.

Read the local `$react-doctor` skill before interpreting React Doctor diagnostics.

## Workflow

1. State the inferred `TARGET_BRANCH`, `BASE_COMMIT`, and changed frontend files.
2. Run React Doctor in diff mode and inspect changed files against Toss and Vercel criteria.
3. Classify findings:
   - `Fix now`: introduced by this branch and within scope.
   - `Defer`: existed before `BASE_COMMIT` or outside the requested scope.
   - `Ask`: target branch or ownership is genuinely ambiguous.
4. Fix only `Fix now` items, smallest coherent patch first.
5. Run `npm run verify`.
6. If verification fails, decide whether the failure is caused by this branch:
   - If yes, fix and repeat checks.
   - If no, leave code unchanged for that issue and record it as deferred.
7. Repeat until scoped React Doctor/Toss/Vercel issues are gone and `npm run verify` passes, or all remaining failures are deferred existing issues.

## Output

Finish with:

- inferred target branch and base commit
- checked changed files
- fixes made
- deferred existing or out-of-scope issues
- commands run and pass/fail result
