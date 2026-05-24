import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { runDeterministicHandoffInit } from './handoff-init.js';

describe('runDeterministicHandoffInit', () => {
  let tmpDir: string;
  let projectDir: string;
  let packetPath: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `handoff-init-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    projectDir = join(tmpDir, 'project');
    packetPath = join(tmpDir, 'packet.md');
    await mkdir(projectDir, { recursive: true });
    await writeFile(packetPath, [
      '# GSD Build Handoff Packet',
      '',
      '## Product Intent',
      '',
      'Build Safari GSD as a portable framework.',
      '',
      '## Owner Context',
      '',
      'Safari provides owner judgment; agents execute.',
      '',
      '## Target User / Customer',
      '',
      'Safari, Claude, Codex, and future agents.',
      '',
      '## Problem Being Solved',
      '',
      'The current path depends on Claude login.',
      '',
      '## Success Criteria',
      '',
      '- Preserve handoff.',
      '- Generate planning docs.',
      '',
      '## Plain-English Acceptance Tests',
      '',
      '| Test | Expected Behavior |',
      '|------|-------------------|',
      '| Start dev project from handoff | Writes `.planning/GSD-HANDOFF.md` |',
      '',
      '## Non-Goals',
      '',
      '- Do not deploy to live runtime.',
      '',
      '## Decisions Already Made',
      '',
      '| Decision | Rationale |',
      '|----------|-----------|',
      '| Use a harness | Avoid provider lock-in |',
      '',
      '## Open Questions',
      '',
      '| Question | Why It Matters |',
      '|----------|----------------|',
      '| Adapter shape | Runtime portability |',
      '',
      '## Assumptions To Validate',
      '',
      '| Assumption | Validation Method |',
      '|------------|-------------------|',
      '| Harness works | Test run |',
      '',
      '## Missing Context',
      '',
      '| Missing Context | Impact |',
      '|-----------------|--------|',
      '| Provider adapters | Blocks deployment |',
      '',
    ].join('\n'), 'utf-8');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('preserves the handoff and writes baseline planning artifacts without a provider-backed model', async () => {
    const result = await runDeterministicHandoffInit({
      projectDir,
      handoffPath: packetPath,
      provider: 'openai',
      runtime: 'codex',
    });

    expect(result.success).toBe(true);
    expect(result.totalCostUsd).toBe(0);
    expect(result.artifacts).toEqual([
      '.planning/GSD-HANDOFF.md',
      '.planning/config.json',
      '.planning/PROJECT.md',
      '.planning/REQUIREMENTS.md',
      '.planning/ROADMAP.md',
      '.planning/STATE.md',
    ]);

    const preserved = await readFile(join(projectDir, '.planning', 'GSD-HANDOFF.md'), 'utf-8');
    const source = await readFile(packetPath, 'utf-8');
    expect(preserved).toBe(source);

    const project = await readFile(join(projectDir, '.planning', 'PROJECT.md'), 'utf-8');
    expect(project).toContain('OpenAI and Anthropic are service providers');
    expect(project).toContain('Claude, Codex, and future agents are runtimes');
    expect(project).toContain('Source: `.planning/GSD-HANDOFF.md`');

    const config = JSON.parse(await readFile(join(projectDir, '.planning', 'config.json'), 'utf-8'));
    expect(config.handoff.provider).toBe('openai');
    expect(config.handoff.runtime).toBe('codex');
    expect(config.handoff.deterministic).toBe(true);
  });

  it('defaults to provider none and runtime harness', async () => {
    await runDeterministicHandoffInit({ projectDir, handoffPath: packetPath });

    const state = await readFile(join(projectDir, '.planning', 'STATE.md'), 'utf-8');
    expect(state).toContain('Service provider: `none`');
    expect(state).toContain('Runtime: `harness`');
  });

  it('rejects unsupported provider labels', async () => {
    const result = await runDeterministicHandoffInit({
      projectDir,
      handoffPath: packetPath,
      provider: 'codex',
    });

    expect(result.success).toBe(false);
    expect(result.steps[0]?.error).toContain('Unsupported handoff provider');
  });
});
