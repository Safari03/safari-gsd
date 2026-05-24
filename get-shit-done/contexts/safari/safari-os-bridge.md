# Safari-OS Bridge

Safari-OS is Safari's knowledge and control plane. Dev repos are the execution plane.

## Control Plane

Safari-OS owns:

- product intent
- decisions and rationale
- source inventory and authority
- missing context
- progress and review history
- production readiness notes

Typical path:

```text
{domain}/00-planning/projects/{project-name}/
```

## Execution Plane

Dev repos own:

- source code
- package files
- dependencies
- tests
- implementation git history
- runtime behavior

Typical paths:

```text
Mac: <mac-dev-projects>/{project-name}
Windows: <windows-dev-projects>\{project-name}
```

## Build Handoff

When a Safari-OS project includes `06-plan/gsd-build-handoff-packet.md`, GSD should import or reference it during project bootstrap.

The packet carries owner/product context. GSD turns that context into engineering requirements, engineering spec, roadmap, implementation phases, tests, and release evidence.

Do not deep-crawl Safari-OS unless the packet or user request points to specific files. Use linked project-room files first.
