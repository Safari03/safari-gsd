# Product Maturity Contract

GSD product work must declare a maturity level before requirements or roadmap planning.

This contract prevents a local implementation slice from being treated as a shipped product. A phase is complete only when the intended user or operator workflow is wired end-to-end at the maturity level declared for the milestone.

## Maturity Levels

| Level | Definition of Done |
|-------|--------------------|
| Prototype | Demonstrates the idea locally. Fake providers, stubs, seed data, local-only flows, and manual setup are allowed when clearly labeled. Completion means the learning goal is proven, not that the product is operational. |
| Local MVP | Works end-to-end on a developer machine with real application wiring. Fake external providers are allowed only behind explicit adapters and only when the milestone does not claim pilot or production readiness. Completion requires local user/operator loops and local tests. |
| Pilot-ready | A real pilot user/operator can run the core loop in a controlled environment. External providers, secrets, scheduled jobs, deployment resources, webhook endpoints, DNS/sender identity, and admin/operator surfaces required for the pilot loop must be configured or explicitly marked blocking. |
| Production-ready | The core product loop is live, monitored, deployed, provider-backed, recoverable, and ready for real customers/operators. Production-critical dependencies cannot be deferred and still count as complete. |

## Research Gate

For pilot-ready and production-ready milestones, GSD must run tech stack/tooling research before implementation. Research must cover:

- Provider choices and alternatives considered
- External dependencies and operational constraints
- Cost, auth, rate-limit, privacy, compliance, and failure-mode risks
- Deployment resources and lifecycle ownership
- Decision log with accepted and rejected options

If this research is missing, planning is blocked for pilot-ready and production-ready work.

## Operational Wiring Inventory

Every product phase must include an operational wiring inventory. If a row is not applicable, write `N/A` with a reason.

| Item | Evidence Required |
|------|-------------------|
| User-facing UI | Screens/routes/components users interact with |
| Admin/operator UI | Staff/operator views, dashboards, admin actions, or reason none exists |
| Service layer | Services, adapters, handlers, and domain logic |
| Background jobs | Queue/task workers and async jobs |
| Schedules | Cron, Celery beat, scheduler rows, periodic tasks, or manual trigger reason |
| External providers/APIs | Provider names, adapters, SDKs, endpoints, and fallback behavior |
| Env vars/secrets | Required variables and where they are documented, never secret values |
| Deployment resources | Web, worker, beat, DB, cache, storage, DNS, sender identity, webhooks |
| Manual/provider setup remaining | Exact external UI/provider steps still required |
| Automated tests | Commands and test files proving the phase |
| Manual verification | Operator/customer checks proving the phase at the declared maturity |

## Hard Gates

- Any phase touching external systems must produce `VERIFICATION.md` before it can close.
- For pilot-ready and production-ready milestones, `VERIFICATION.md` must include operational evidence for every production-critical dependency touched by the phase.
- If a provider, schedule, deployment, secret, DNS record, webhook, or manual setup is required for the core loop, the phase is `blocked` or `partial` until that dependency is working or the milestone maturity is downgraded.
- `deferred but complete` is forbidden for production-critical dependencies.
- Fake providers, stubs, placeholder views, empty dashboards, `NotImplementedError`, unscheduled background jobs, undeployed webhooks, and missing provider credentials are blockers when they sit on the declared core loop for pilot-ready or production-ready work.

## Milestone Audit Gate

Milestone audit must verify the actual product loop, not only phase artifacts.

Audit must check:

- Missing `VERIFICATION.md`
- Deferred provider setup
- Fake/stub providers or placeholder implementations
- Empty user/admin/operator views
- Unscheduled Celery/background tasks
- Undeployed webhooks
- Missing env/secrets/DNS/sender identity/deployment resources
- Planning drift between `PROJECT.md`, `ROADMAP.md`, `STATE.md`, `AGENTS.md`, stack docs, and codebase evidence
- End-to-end customer/operator loop for the declared milestone

If a milestone was previously closed under weaker criteria, route recovery to:

1. `$gsd-forensics`
2. `$gsd-audit-milestone`
3. A new hardening milestone

Do not route directly to `$gsd-complete-milestone`.
