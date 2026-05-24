import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { InitResult, InitStepResult } from './types.js';

export type HandoffServiceProvider = 'none' | 'anthropic' | 'openai' | 'other';
export type HandoffRuntime = 'harness' | 'claude' | 'codex' | 'other';

export interface HandoffInitOptions {
  projectDir: string;
  handoffPath: string;
  provider?: string;
  runtime?: string;
}

interface HandoffContext {
  packet: string;
  sourcePath: string;
  provider: HandoffServiceProvider;
  runtime: HandoffRuntime;
  title: string;
  productIntent: string;
  ownerContext: string;
  targetUser: string;
  problem: string;
  successCriteria: string;
  acceptanceTests: string;
  nonGoals: string;
  decisions: string;
  openQuestions: string;
  assumptions: string;
  missingContext: string;
}

const PROVIDERS = new Set<HandoffServiceProvider>(['none', 'anthropic', 'openai', 'other']);
const RUNTIMES = new Set<HandoffRuntime>(['harness', 'claude', 'codex', 'other']);

const DEFAULT_CONFIG = {
  mode: 'yolo',
  parallelization: true,
  depth: 'quick',
  workflow: {
    research: true,
    plan_checker: true,
    verifier: true,
    auto_advance: true,
    skip_discuss: false,
  },
};

export async function runDeterministicHandoffInit(options: HandoffInitOptions): Promise<InitResult> {
  const startTime = Date.now();
  const steps: InitStepResult[] = [];
  const artifacts: string[] = [];

  try {
    const provider = normalizeProvider(options.provider);
    const runtime = normalizeRuntime(options.runtime);
    const sourcePath = resolve(options.handoffPath);
    const packet = await readFile(sourcePath, 'utf-8');
    const context = buildContext(packet, sourcePath, provider, runtime);
    const planningDir = resolve(options.projectDir, '.planning');

    await runStep(steps, 'setup', async () => {
      await mkdir(planningDir, { recursive: true });
    });

    await runStep(steps, 'handoff', async () => {
      await writeFile(resolve(planningDir, 'GSD-HANDOFF.md'), packet, 'utf-8');
      artifacts.push('.planning/GSD-HANDOFF.md');
    });

    await runStep(steps, 'config', async () => {
      await writeFile(
        resolve(planningDir, 'config.json'),
        JSON.stringify(buildConfig(context), null, 2) + '\n',
        'utf-8',
      );
      artifacts.push('.planning/config.json');
    });

    await runStep(steps, 'project', async () => {
      await writeFile(resolve(planningDir, 'PROJECT.md'), renderProject(context), 'utf-8');
      artifacts.push('.planning/PROJECT.md');
    });

    await runStep(steps, 'requirements', async () => {
      await writeFile(resolve(planningDir, 'REQUIREMENTS.md'), renderRequirements(context), 'utf-8');
      artifacts.push('.planning/REQUIREMENTS.md');
    });

    await runStep(steps, 'roadmap', async () => {
      await writeFile(resolve(planningDir, 'ROADMAP.md'), renderRoadmap(context), 'utf-8');
      await writeFile(resolve(planningDir, 'STATE.md'), renderState(context), 'utf-8');
      artifacts.push('.planning/ROADMAP.md', '.planning/STATE.md');
    });

    return {
      success: true,
      steps,
      totalCostUsd: 0,
      totalDurationMs: Date.now() - startTime,
      artifacts,
    };
  } catch (err) {
    steps.push({
      step: 'setup',
      success: false,
      durationMs: 0,
      costUsd: 0,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      success: false,
      steps,
      totalCostUsd: 0,
      totalDurationMs: Date.now() - startTime,
      artifacts,
    };
  }
}

async function runStep(
  steps: InitStepResult[],
  step: InitStepResult['step'],
  fn: () => Promise<void>,
): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    steps.push({ step, success: true, durationMs: Date.now() - start, costUsd: 0 });
  } catch (err) {
    steps.push({
      step,
      success: false,
      durationMs: Date.now() - start,
      costUsd: 0,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

function normalizeProvider(provider?: string): HandoffServiceProvider {
  const value = (provider ?? 'none').toLowerCase() as HandoffServiceProvider;
  if (!PROVIDERS.has(value)) {
    throw new Error(`Unsupported handoff provider "${provider}". Use none, anthropic, openai, or other.`);
  }
  return value;
}

function normalizeRuntime(runtime?: string): HandoffRuntime {
  const value = (runtime ?? 'harness').toLowerCase() as HandoffRuntime;
  if (!RUNTIMES.has(value)) {
    throw new Error(`Unsupported handoff runtime "${runtime}". Use harness, claude, codex, or other.`);
  }
  return value;
}

function buildContext(
  packet: string,
  sourcePath: string,
  provider: HandoffServiceProvider,
  runtime: HandoffRuntime,
): HandoffContext {
  return {
    packet,
    sourcePath,
    provider,
    runtime,
    title: extractTitle(packet),
    productIntent: extractSection(packet, 'Product Intent'),
    ownerContext: extractSection(packet, 'Owner Context'),
    targetUser: extractSection(packet, 'Target User / Customer'),
    problem: extractSection(packet, 'Problem Being Solved'),
    successCriteria: extractSection(packet, 'Success Criteria'),
    acceptanceTests: extractSection(packet, 'Plain-English Acceptance Tests'),
    nonGoals: extractSection(packet, 'Non-Goals'),
    decisions: extractSection(packet, 'Decisions Already Made'),
    openQuestions: extractSection(packet, 'Open Questions'),
    assumptions: extractSection(packet, 'Assumptions To Validate'),
    missingContext: extractSection(packet, 'Missing Context'),
  };
}

function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || 'GSD Handoff Project';
}

function extractSection(markdown: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|\\n---\\s*$|$)`, 'm');
  const match = markdown.match(pattern);
  return cleanSection(match?.[1]);
}

function cleanSection(value?: string): string {
  const cleaned = (value ?? '').trim();
  return cleaned || 'Not specified in handoff packet.';
}

function buildConfig(context: HandoffContext): Record<string, unknown> {
  return {
    ...DEFAULT_CONFIG,
    handoff: {
      source_path: context.sourcePath,
      preserved_path: '.planning/GSD-HANDOFF.md',
      provider: context.provider,
      runtime: context.runtime,
      provider_runtime_contract:
        'OpenAI and Anthropic are service providers. Claude, Codex, and future agents are runtimes or model choices behind the same Safari GSD contract.',
      deterministic: true,
    },
  };
}

function renderProject(context: HandoffContext): string {
  return `# PROJECT

## What This Is

${context.productIntent}

## Core Value

Preserve Safari-OS owner/product context from \`.planning/GSD-HANDOFF.md\` before engineering planning starts.

## Safari-OS Handoff

Source: \`.planning/GSD-HANDOFF.md\`

Original packet: \`${context.sourcePath}\`

${context.ownerContext}

The handoff is owner/product context, not the final engineering spec. GSD discovery, research, requirements, and roadmap stages validate and harden this packet instead of restarting from zero.

## Provider / Runtime Contract

- Service provider: \`${context.provider}\`
- Runtime: \`${context.runtime}\`
- OpenAI and Anthropic are service providers.
- Claude, Codex, and future agents are runtimes or model choices behind the Safari GSD contract.
- The deterministic harness owns file placement, artifact names, and baseline validation before any provider-backed model runs.

## Target Users

${context.targetUser}

## Problem

${context.problem}

## Success Criteria

${context.successCriteria}

## Non-Goals

${context.nonGoals}

## Key Decisions

${context.decisions}

## Open Questions

${context.openQuestions}

## Evolution

This document evolves as provider-backed runtimes validate the handoff. Do not remove the \`.planning/GSD-HANDOFF.md\` reference; it is the preserved owner-context anchor.

---
*Last updated: ${today()} after deterministic handoff initialization*
`;
}

function renderRequirements(context: HandoffContext): string {
  return `# REQUIREMENTS

**Source Context:** \`.planning/GSD-HANDOFF.md\`
**Service Provider:** \`${context.provider}\`
**Runtime:** \`${context.runtime}\`

## Provider / Runtime Requirement

- [ ] REQ-000: Safari GSD MUST treat OpenAI and Anthropic as service providers, while Claude, Codex, and future agents are runtimes or model choices.

## Functional Requirements

- [ ] REQ-001: Preserve the handoff packet as \`.planning/GSD-HANDOFF.md\` before project artifacts are generated.
- [ ] REQ-002: Generate PROJECT, REQUIREMENTS, ROADMAP, and STATE from the preserved handoff as owner/product context.
- [ ] REQ-003: Treat discovery and research as validation/hardening of the packet instead of zero-state product discovery.
- [ ] REQ-004: Carry open questions, assumptions, missing context, and blockers forward into planning artifacts.
- [ ] REQ-005: Keep live runtime deployment blocked until dry-run comparison, backup, rollback, version identity, and runtime layout gates pass.

## Handoff Acceptance Tests

${context.acceptanceTests}

## Success Criteria From Packet

${context.successCriteria}

## Assumptions To Validate

${context.assumptions}

## Missing Context / Blockers

${context.missingContext}

---
*Last updated: ${today()} after deterministic handoff initialization*
`;
}

function renderRoadmap(context: HandoffContext): string {
  return `# ROADMAP

## Phase 01: Deterministic Handoff Import

Goal: Preserve the Safari-OS handoff packet before any provider-backed model execution.

Requirements: REQ-000, REQ-001.

Deliverables:
- \`.planning/GSD-HANDOFF.md\`
- \`.planning/config.json\` with provider/runtime contract metadata

## Phase 02: Owner-Context Planning Artifacts

Goal: Generate project artifacts from the preserved owner/product context.

Requirements: REQ-002, REQ-003, REQ-004.

Deliverables:
- \`.planning/PROJECT.md\`
- \`.planning/REQUIREMENTS.md\`
- \`.planning/ROADMAP.md\`
- \`.planning/STATE.md\`

## Phase 03: Provider Adapters

Goal: Allow Claude, Codex, and future runtimes to enrich the deterministic baseline through service-provider adapters.

Requirements: REQ-000, REQ-003.

Notes:
- OpenAI is a service provider, not the runtime identity.
- Anthropic is a service provider, not the runtime identity.
- Claude and Codex are runtime/model execution choices.

## Phase 04: Deployment Safety

Goal: Make live runtime deployment reviewable and reversible.

Requirements: REQ-005.

Deliverables:
- dry-run comparison
- backup command
- rollback command
- deployment gate report

## Source Packet Summary

${context.title}

---
*Last updated: ${today()} after deterministic handoff initialization*
`;
}

function renderState(context: HandoffContext): string {
  return `# STATE

Project: ${context.title}
Current phase: Phase 01 - Deterministic Handoff Import
Source context: \`.planning/GSD-HANDOFF.md\`
Service provider: \`${context.provider}\`
Runtime: \`${context.runtime}\`

## Current Status

The project was initialized from a Safari-OS GSD Build Handoff Packet through the deterministic harness. No provider-backed model login is required for packet preservation or baseline artifact generation.

## Provider / Runtime Contract

OpenAI and Anthropic are service providers. Claude, Codex, and future agents are runtimes or model choices behind the same Safari GSD contract.

## Next Action

Run provider-backed validation only after the deterministic artifacts are present and the target runtime adapter is selected.

---
*Last updated: ${today()} after deterministic handoff initialization*
`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
