# PROJECT.md Template

Template for `.planning/PROJECT.md` — the living project context document.

<template>

```markdown
# [Project Name]

## What This Is

[Current accurate description — 2-3 sentences. What does this product do and who is it for?
Use the user's language and framing. Update whenever reality drifts from this description.]

## Core Value

[The ONE thing that matters most. If everything else fails, this must work.
One sentence that drives prioritization when tradeoffs arise.]

## Product Maturity

**Current Milestone Maturity:** [Prototype / Local MVP / Pilot-ready / Production-ready]

**Definition of Done at this maturity:**
[What must be wired end-to-end before GSD can call this milestone complete. For pilot-ready and production-ready, include provider, deployment, schedule, webhook, DNS/sender, env/secrets, and operator readiness requirements.]

**Core Product Loop:**
[The customer/operator loop milestone audit must verify end-to-end, e.g. signup -> upload -> outbound -> inbound -> classify -> close -> bill.]

**Operational Dependencies:**
[External providers, background workers, schedules, secrets/env, deployment resources, DNS/sender identity, webhooks, and manual setup steps required for the declared maturity.]

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] [Requirement 1]
- [ ] [Requirement 2]
- [ ] [Requirement 3]

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- [Exclusion 1] — [why]
- [Exclusion 2] — [why]

## Context

[Background information that informs implementation:
- Technical environment or ecosystem
- Relevant prior work or experience
- User research or feedback themes
- Known issues to address]

## Safari-OS Handoff

[If this project started from Safari-OS, link `.planning/GSD-HANDOFF.md` and summarize the owner/product context that must survive engineering planning. If not applicable, write "Not applicable."]

## Constraints

- **[Type]**: [What] — [Why]
- **[Type]**: [What] — [Why]

Common types: Tech stack, Timeline, Budget, Dependencies, Compatibility, Performance, Security

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| [Choice] | [Why] | [✓ Good / ⚠️ Revisit / — Pending] |

---
*Last updated: [date] after [trigger]*
```

</template>

<guidelines>

**What This Is:**
- Current accurate description of the product
- 2-3 sentences capturing what it does and who it's for
- Use the user's words and framing
- Update when the product evolves beyond this description

**Core Value:**
- The single most important thing
- Everything else can fail; this cannot
- Drives prioritization when tradeoffs arise
- Rarely changes; if it does, it's a significant pivot

**Product Maturity:**
- Required before requirements and roadmap planning
- Prototype allows labeled stubs/fakes for learning goals
- Local MVP requires a real local end-to-end loop
- Pilot-ready and Production-ready require operational wiring evidence
- If production-critical provider/setup/deployment work is deferred, the milestone is blocked or partial, not complete

**Requirements — Validated:**
- Requirements that shipped and proved valuable
- Format: `- ✓ [Requirement] — [version/phase]`
- These are locked — changing them requires explicit discussion

**Requirements — Active:**
- Current scope being built toward
- These are hypotheses until shipped and validated
- Move to Validated when shipped, Out of Scope if invalidated

**Requirements — Out of Scope:**
- Explicit boundaries on what we're not building
- Always include reasoning (prevents re-adding later)
- Includes: considered and rejected, deferred to future, explicitly excluded

**Context:**
- Background that informs implementation decisions
- Technical environment, prior work, user feedback
- Known issues or technical debt to address
- Update as new context emerges

**Safari-OS Handoff:**
- Present only when the project starts from a Safari-OS GSD Build Handoff Packet
- Link `.planning/GSD-HANDOFF.md`
- Summarize owner/product context, non-goals, decisions, acceptance tests, and missing context
- Do not treat the handoff as the engineering spec; GSD validates and hardens it

**Constraints:**
- Hard limits on implementation choices
- Tech stack, timeline, budget, compatibility, dependencies
- Include the "why" — constraints without rationale get questioned

**Key Decisions:**
- Significant choices that affect future work
- Add decisions as they're made throughout the project
- Track outcome when known:
  - ✓ Good — decision proved correct
  - ⚠️ Revisit — decision may need reconsideration
  - — Pending — too early to evaluate

**Last Updated:**
- Always note when and why the document was updated
- Format: `after Phase 2` or `after v1.0 milestone`
- Triggers review of whether content is still accurate

</guidelines>

<evolution>

PROJECT.md evolves throughout the project lifecycle.
These rules are embedded in the generated PROJECT.md (## Evolution section)
and implemented by workflows/transition.md and workflows/complete-milestone.md.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state (users, feedback, metrics)

</evolution>

<brownfield>

For existing codebases:

1. **Map codebase first** via `/gsd:map-codebase`

2. **Infer Validated requirements** from existing code:
   - What does the codebase actually do?
   - What patterns are established?
   - What's clearly working and relied upon?

3. **Gather Active requirements** from user:
   - Present inferred current state
   - Ask what they want to build next

4. **Initialize:**
   - Validated = inferred from existing code
   - Active = user's goals for this work
   - Out of Scope = boundaries user specifies
   - Context = includes current codebase state

</brownfield>

<state_reference>

STATE.md references PROJECT.md:

```markdown
## Project Reference

See: .planning/PROJECT.md (updated [date])

**Core value:** [One-liner from Core Value section]
**Current focus:** [Current phase name]
```

This ensures Claude reads current PROJECT.md context.

</state_reference>
