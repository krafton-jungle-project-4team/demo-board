---
name: react-doctor
description: Use when finishing a feature, fixing a bug, before committing React code, or when the user types `/doctor`, asks to scan, triage, or clean up React diagnostics. Covers lint, accessibility, bundle size, architecture. Includes a regression check and a full local-triage workflow that fetches the canonical playbook.
---

# React Doctor

Use this Codex skill to inspect React code for security, performance, correctness, and architecture issues. Do not add or rely on a repository-level doctor wrapper; invoke this skill directly from Codex workflows such as `$react-doctor` or `$clean-react`.

## After making React code changes:

Run this skill as a diff/regression pass on the changed React files and check that the result did not regress.

If the pass finds a new issue, fix the regression before committing.

## For general cleanup or code improvement:

Run this skill as a full local triage pass. Fix issues by severity: errors first, then warnings.

## /doctor — full local triage workflow

When the user types `/doctor`, says "run react doctor", asks to invoke this skill, or asks for a full triage / cleanup pass (not just a regression check), fetch the canonical local-triage playbook and follow every step in it:

```bash
curl --fail --silent --show-error \
  --header 'Cache-Control: no-cache' \
  https://www.react.doctor/prompts/react-doctor-agent.md
```

The playbook is the single source of truth — a scan → filter → triage → fix → validate loop that edits the working tree directly (never commits, never opens PRs). Updating the prompt at its source updates every agent on its next fetch — no skill reinstall needed.

Pair it with the matching per-rule prompts at `https://www.react.doctor/prompts/rules/<plugin>/<rule>.md` (fetched on demand inside the playbook) so each fix uses the canonical, reviewer-tested recipe.

## Configuring or explaining rules

When the user wants to understand a rule, disagrees with one, or wants to disable / tune which rules run (not fix code), read [references/explain.md](references/explain.md) and follow it. Explain the rule first, then apply the narrowest config change in `doctor.config.*` or `package.json#reactDoctor`.
