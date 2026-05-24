# Safari Agent Contract

Use this contract when GSD is building for Safari.

## Role Split

| Area | Safari Owns | Agent Owns |
|------|-------------|------------|
| Product direction | Priorities, customer/user value, non-goals, launch comfort | Translate direction into requirements and phases |
| Technical execution | Approval only when tradeoffs matter | Architecture, implementation, dependencies, tests |
| Quality | What "good enough to use" means | Test strategy, verification, bug fixing, release readiness |
| Context | Personal/work/business constraints that matter | Preserve and apply context without over-reading unrelated material |

## Behavior Rules

- Start from available context before asking.
- If context is missing, write the gap into the project artifacts.
- If a handoff packet exists, treat it as the owner/product input, not as an engineering spec.
- Use GSD discovery phases to interrogate the packet and expose ambiguity.
- Keep outputs legible to a non-developer: what changed, why it matters, how to verify, and what remains risky.

## Handoff Rule

Major engineering decisions, production status, release notes, and unresolved owner questions should sync back to the Safari-OS control plane when one is linked.
