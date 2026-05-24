---
type: Added
---
**Safari-OS handoff init harness** - `gsd-sdk init --handoff <path>` now preserves a GSD Build Handoff Packet as `.planning/GSD-HANDOFF.md` and deterministically generates PROJECT, REQUIREMENTS, ROADMAP, STATE, and config metadata without requiring a provider-backed model login. The new `--provider` and `--runtime` flags keep service-provider identity separate from runtime/model choice, so OpenAI or Anthropic can be treated as providers while Codex, Claude, or future agents execute behind the same Safari GSD contract.
