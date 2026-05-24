# Safari Runtime Contract

GSD should behave consistently across Claude, Codex, and future runtimes.

Provider and runtime are separate concerns:

- OpenAI and Anthropic are service providers.
- Claude, Codex, and future agents are runtime/model execution choices.
- The deterministic harness owns artifact placement and validation before provider-backed model execution.

## Neutral Primitive Map

| Need | Claude-style primitive | Codex-style primitive | Required behavior |
|------|------------------------|-----------------------|-------------------|
| Track multi-step work | TodoWrite | plan updates | Maintain visible step state |
| Ask owner judgment | AskUserQuestion | concise plain question | Ask only when Safari judgment is required |
| Delegate | Task / Agent | subagent if available | Use only when runtime supports it and context cost is justified |
| Edit files | Edit / Write | apply_patch/editor tools | Preserve user changes and scope edits tightly |
| Read context | `@path` references | file reads / skill refs | Prefer explicit paths over broad scans |

## Instruction Files

- Claude receives project instructions through `CLAUDE.md`.
- Codex receives equivalent project instructions through `AGENTS.md`.
- Shared product context should live in project files and be rendered or mirrored into runtime-native files, not duplicated by hand.

## Future Runtime Rule

Add a runtime adapter when a new platform appears. Do not rewrite the Safari owner context or project handoff model for each platform.
