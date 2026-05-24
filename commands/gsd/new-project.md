---
name: gsd:new-project
description: Initialize a new project with deep context gathering and PROJECT.md
argument-hint: "[--auto] [--handoff @path] [--provider none|anthropic|openai|other] [--runtime harness|claude|codex|other]"
allowed-tools:
  - Read
  - Bash
  - Write
  - Agent
  - AskUserQuestion
requires: [config, phase, plan-phase]
---
<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `AskUserQuestion`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API.
</runtime_note>

<context>
**Flags:**
- `--auto` — Automatic mode. After config questions, runs research → requirements → roadmap without further interaction. Expects idea document via @ reference.
- `--handoff @path` — Start from a Safari-OS GSD Build Handoff Packet. GSD should validate and harden the packet instead of restarting from zero.
- `--provider` — Service provider label only (`none`, `anthropic`, `openai`, `other`). OpenAI and Anthropic are providers, not runtime identities.
- `--runtime` — Runtime/model execution label (`harness`, `claude`, `codex`, `other`). Claude, Codex, and future agents run behind the same contract.
</context>

<objective>
Initialize a new project through unified flow: questioning → research (optional) → requirements → roadmap.

**Creates:**
- `.planning/PROJECT.md` — project context
- `.planning/config.json` — workflow preferences
- `.planning/research/` — domain research (optional)
- `.planning/REQUIREMENTS.md` — scoped requirements
- `.planning/ROADMAP.md` — phase structure
- `.planning/STATE.md` — project memory

**After this command:** Run `/gsd:plan-phase 1` to start execution.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/new-project.md
@~/.claude/get-shit-done/references/questioning.md
@~/.claude/get-shit-done/references/ui-brand.md
@~/.claude/get-shit-done/templates/project.md
@~/.claude/get-shit-done/templates/requirements.md
@~/.claude/get-shit-done/contexts/safari/owner.md
@~/.claude/get-shit-done/contexts/safari/agent-contract.md
@~/.claude/get-shit-done/contexts/safari/safari-os-bridge.md
@~/.claude/get-shit-done/contexts/safari/runtime-contract.md
</execution_context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, approvals, commits, routing).
</process>
