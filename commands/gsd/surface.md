---
name: gsd:surface
description: Toggle which skills are surfaced — apply a profile, list, or disable a cluster without reinstall
argument-hint: "[list|status|profile <name>|disable <cluster>|enable <cluster>|reset]"
allowed-tools:
  - Read
  - Write
  - Bash
requires: [config, update]
---

<objective>
Manage the runtime skill surface without reinstall. Reads/writes `.gsd-surface.json`
(sibling to `.gsd-profile`) under the active runtime config directory and re-stages
the active skills directory in place. Skill dirs live under the runtime layout's
configured skills destination.

Sub-commands: list · status · profile · disable · enable · reset
</objective>

## Sub-command routing

Parse the first token of $ARGUMENTS:

| Token | Action |
|---|---|
| `list` | Show enabled + disabled clusters and skills |
| `status` | Alias for `list` plus token cost summary |
| `profile <name>` | Write `baseProfile` and re-stage |
| `profile <n1>,<n2>` | Composed profiles (comma-separated, no spaces) |
| `disable <cluster>` | Add cluster to `disabledClusters`, re-stage |
| `enable <cluster>` | Remove cluster from `disabledClusters`, re-stage |
| `reset` | Delete `.gsd-surface.json`, return to install-time profile |
| *(none)* | Treat as `list` |

---

## list / status

Call `listSurface(runtimeConfigDir, manifest, CLUSTERS)` from
`get-shit-done/bin/lib/surface.cjs`. Display:

```
Enabled (N skills, ~T tokens):
  core_loop:   new-project  discuss-phase  plan-phase  execute-phase  help  update
  audit_review: …
  …

Disabled:
  utility:  health  stats  settings  …

Token cost: ~T (budget cap ~500 tokens for 200k context @ 1%)
```

For `status` also append:

```
Base profile:   standard  (from .gsd-surface.json)
Install profile: standard  (from .gsd-profile)
```

---

## profile \<name\>

1. Read current surface: `readSurface(runtimeConfigDir)` → if null, seed from `readActiveProfile(runtimeConfigDir)`.
2. Set `surfaceState.baseProfile = name`.
3. `writeSurface(runtimeConfigDir, surfaceState)`.
4. Resolve and re-apply:
   ```js
   const layout = resolveRuntimeArtifactLayout(runtime, runtimeConfigDir, scope);
   applySurface(runtimeConfigDir, layout, manifest, CLUSTERS);
   ```
5. Confirm: "Surface updated to profile `<name>`. N skills enabled."

---

## disable \<cluster\>

Valid cluster names: `core_loop`, `audit_review`, `milestone`, `research_ideate`,
`workspace_state`, `docs`, `ui`, `ai_eval`, `ns_meta`, `utility`.

1. Validate cluster name against `Object.keys(CLUSTERS)`.
2. Read or initialize surface state.
3. Add cluster to `surfaceState.disabledClusters` (deduplicate).
4. `writeSurface` → resolve layout → `applySurface`:
   ```js
   const layout = resolveRuntimeArtifactLayout(runtime, runtimeConfigDir, scope);
   applySurface(runtimeConfigDir, layout, manifest, CLUSTERS);
   ```
5. Confirm: "Disabled cluster `<cluster>`. N skills removed from surface."

---

## enable \<cluster\>

1. Read surface state; if null, nothing to enable — print "No surface delta active."
2. Remove cluster from `surfaceState.disabledClusters`.
3. `writeSurface` → resolve layout → `applySurface`:
   ```js
   const layout = resolveRuntimeArtifactLayout(runtime, runtimeConfigDir, scope);
   applySurface(runtimeConfigDir, layout, manifest, CLUSTERS);
   ```
4. Confirm: "Enabled cluster `<cluster>`. N skills added back to surface."

---

## reset

1. Check if `.gsd-surface.json` exists.
2. Delete it.
3. Re-apply using only `readActiveProfile(runtimeConfigDir)` (install-time profile).
4. Confirm: "Surface reset to install-time profile `<name>`."

---

## runtimeConfigDir resolution

The `runtimeConfigDir` for `applySurface` is the **base runtime config directory**,
NOT the skills sub-directory.

This matches `installRuntimeArtifacts` and `uninstallRuntimeArtifacts`, which also
receive the base runtime directory as `configDir`. The skill dirs themselves are
derived from `resolveRuntimeArtifactLayout(runtime, runtimeConfigDir, scope)`, not
hard-coded to one provider or runtime root.

```bash
# Claude Code global install example: use CLAUDE_CONFIG_DIR or the Claude
# default config directory under the user's home.
# Codex global install example: use CODEX_HOME or the Codex default config
# directory under the user's home.
SCOPE="global"

# Artifact destinations are derived from runtime layout
# via resolveRuntimeArtifactLayout(runtime, RUNTIME_CONFIG_DIR, SCOPE)
# then applySurface(RUNTIME_CONFIG_DIR, layout, manifest, CLUSTERS)
```

Surface state is stored at `${RUNTIME_CONFIG_DIR}/.gsd-surface.json`
for the active runtime.

Runtime config roots can be overridden by their runtime-specific environment
variables such as `CLAUDE_CONFIG_DIR` or `CODEX_HOME`.

---

## Error handling

- Unknown cluster name → list valid cluster names, exit without writing.
- Unknown profile name → list known profiles (`core`, `standard`, `full`), exit.
- Missing `surface.cjs` → prompt: "Run `npm i -g get-shit-done` to reinstall GSD."

<execution_context>
Surface state file: `${RUNTIME_CONFIG_DIR}/.gsd-surface.json`
Install profile marker: `${RUNTIME_CONFIG_DIR}/.gsd-profile`
Skill dirs: derived from `resolveRuntimeArtifactLayout(runtime, RUNTIME_CONFIG_DIR, scope)`
Engine module: `${RUNTIME_CONFIG_DIR}/get-shit-done/bin/lib/surface.cjs`
Cluster definitions: `${RUNTIME_CONFIG_DIR}/get-shit-done/bin/lib/clusters.cjs`
</execution_context>
