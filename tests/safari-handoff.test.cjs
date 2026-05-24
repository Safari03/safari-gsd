'use strict';

// allow-test-rule: reads product workflow markdown to verify the Safari-OS handoff bridge contract.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

describe('Safari-OS GSD Build Handoff bridge', () => {
  test('new-project command advertises the handoff flag and Safari context pack', () => {
    const command = read('commands/gsd/new-project.md');

    assert.match(command, /argument-hint: "\[--auto\] \[--handoff @path\]/);
    assert.match(command, /--handoff @path/);
    assert.match(command, /--provider/);
    assert.match(command, /--runtime/);
    assert.match(command, /OpenAI and Anthropic are providers/);
    assert.match(command, /contexts\/safari\/owner\.md/);
    assert.match(command, /contexts\/safari\/agent-contract\.md/);
    assert.match(command, /contexts\/safari\/safari-os-bridge\.md/);
    assert.match(command, /contexts\/safari\/runtime-contract\.md/);
  });

  test('new-project workflow preserves the handoff packet before discovery', () => {
    const workflow = read('get-shit-done/workflows/new-project.md');

    assert.match(workflow, /Safari-OS handoff preflight/);
    assert.match(workflow, /\.planning\/GSD-HANDOFF\.md/);
    assert.match(workflow, /owner-critical missing context as a planning blocker/i);
    assert.match(workflow, /validat(?:e|ion).*harden/i);
    assert.match(workflow, /not restart discovery from zero/i);
  });

  test('project template exposes the handoff as owner input, not engineering spec', () => {
    const template = read('get-shit-done/templates/project.md');

    assert.match(template, /## Safari-OS Handoff/);
    assert.match(template, /\.planning\/GSD-HANDOFF\.md/);
    assert.match(template, /not treat the handoff as the engineering spec/i);
  });

  test('Safari context files and handoff template are packaged under get-shit-done', () => {
    const required = [
      'get-shit-done/contexts/safari/owner.md',
      'get-shit-done/contexts/safari/agent-contract.md',
      'get-shit-done/contexts/safari/safari-os-bridge.md',
      'get-shit-done/contexts/safari/runtime-contract.md',
      'get-shit-done/templates/gsd-build-handoff.md',
    ];

    for (const rel of required) {
      assert.ok(fs.existsSync(path.join(ROOT, rel)), `${rel} should exist`);
    }
  });
});
