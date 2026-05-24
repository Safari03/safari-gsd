#!/usr/bin/env node
'use strict';

const cp = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const INSTALLER = path.join(REPO_ROOT, 'bin', 'install.js');
const PACKAGE = require(path.join(REPO_ROOT, 'package.json'));

const MANAGED_ENTRIES = [
  'skills',
  'agents',
  'get-shit-done',
  'hooks',
  'config.toml',
  'hooks.json',
  'gsd-file-manifest.json',
  '.gsd-profile',
  '.gsd-surface.json',
];

function parseArgs(argv) {
  const opts = {
    mode: 'dry-run',
    liveDir: process.env.CODEX_HOME || path.join(os.homedir(), '.codex'),
    profile: 'full',
    reportDir: null,
    backupDir: null,
    confirmLiveWrite: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === 'dry-run' || arg === 'backup' || arg === 'deploy' || arg === 'rollback') {
      opts.mode = arg;
    } else if (arg === '--live-dir') {
      opts.liveDir = requireValue(argv, ++i, arg);
    } else if (arg === '--profile') {
      opts.profile = requireValue(argv, ++i, arg);
    } else if (arg.startsWith('--profile=')) {
      opts.profile = arg.slice('--profile='.length);
    } else if (arg === '--report-dir') {
      opts.reportDir = requireValue(argv, ++i, arg);
    } else if (arg.startsWith('--report-dir=')) {
      opts.reportDir = arg.slice('--report-dir='.length);
    } else if (arg === '--backup-dir') {
      opts.backupDir = requireValue(argv, ++i, arg);
    } else if (arg.startsWith('--backup-dir=')) {
      opts.backupDir = arg.slice('--backup-dir='.length);
    } else if (arg.startsWith('--live-dir=')) {
      opts.liveDir = arg.slice('--live-dir='.length);
    } else if (arg === '--confirm-live-write') {
      opts.confirmLiveWrite = true;
    } else if (arg === '-h' || arg === '--help') {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  opts.liveDir = path.resolve(opts.liveDir);
  if (opts.reportDir) opts.reportDir = path.resolve(opts.reportDir);
  if (opts.backupDir) opts.backupDir = path.resolve(opts.backupDir);
  return opts;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
  return value;
}

function printUsage() {
  console.log(`
Usage:
  node scripts/safari-runtime-deploy.cjs dry-run [--live-dir ~/.codex] [--report-dir <dir>]
  node scripts/safari-runtime-deploy.cjs backup --backup-dir <dir> [--live-dir ~/.codex]
  node scripts/safari-runtime-deploy.cjs deploy --backup-dir <dir> --confirm-live-write [--live-dir ~/.codex]
  node scripts/safari-runtime-deploy.cjs rollback --backup-dir <dir> --confirm-live-write [--live-dir ~/.codex]

Dry-run never writes to the live Codex directory. Deploy and rollback require
--confirm-live-write and operate only on managed Safari GSD runtime entries.
`.trim());
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, 'Z');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function listFiles(root) {
  const files = new Map();
  if (!fs.existsSync(root)) return files;

  function walk(abs) {
    const rel = path.relative(root, abs).replace(/\\/g, '/');
    const stat = fs.lstatSync(abs);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(abs)) walk(path.join(abs, entry));
      return;
    }
    if (stat.isFile() || stat.isSymbolicLink()) {
      files.set(rel, hashFile(abs));
    }
  }

  for (const entry of fs.readdirSync(root)) walk(path.join(root, entry));
  return files;
}

function hashFile(file) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(file));
  return h.digest('hex');
}

function managedFileMap(root) {
  const out = new Map();
  for (const entry of MANAGED_ENTRIES) {
    const abs = path.join(root, entry);
    if (!fs.existsSync(abs)) continue;
    if (fs.lstatSync(abs).isFile()) {
      out.set(entry, hashFile(abs));
      continue;
    }
    for (const [rel, hash] of listFiles(abs)) {
      out.set(`${entry}/${rel}`.replace(/\/$/g, ''), hash);
    }
  }
  return out;
}

function summarizeComparison(liveDir, dryDir) {
  const live = managedFileMap(liveDir);
  const dry = managedFileMap(dryDir);
  let same = 0;
  let changed = 0;
  let newFiles = 0;
  let missingFromDry = 0;

  for (const [rel, hash] of dry) {
    if (!live.has(rel)) newFiles += 1;
    else if (live.get(rel) === hash) same += 1;
    else changed += 1;
  }
  for (const rel of live.keys()) {
    if (!dry.has(rel)) missingFromDry += 1;
  }

  return {
    liveDir,
    dryDir,
    packageVersion: PACKAGE.version,
    liveFiles: live.size,
    dryFiles: dry.size,
    same,
    changed,
    newFiles,
    missingFromDry,
    liveSkillCount: countDirs(path.join(liveDir, 'skills'), /^gsd-/),
    drySkillCount: countDirs(path.join(dryDir, 'skills'), /^gsd-/),
    liveAgentTomlCount: countFiles(path.join(liveDir, 'agents'), /^gsd-.*\.toml$/),
    dryAgentTomlCount: countFiles(path.join(dryDir, 'agents'), /^gsd-.*\.toml$/),
    liveLegacyGsdAgentCount: countFiles(path.join(liveDir, 'gsd-agents'), /^gsd-.*\.md$/),
    codexInstructionLeaks: findTextLeaksInRoots(dryDir, ['skills', 'agents'], '.claude'),
  };
}

function countDirs(dir, pattern) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((entry) => {
    const abs = path.join(dir, entry);
    return pattern.test(entry) && fs.existsSync(abs) && fs.lstatSync(abs).isDirectory();
  }).length;
}

function countFiles(dir, pattern) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((entry) => {
    const abs = path.join(dir, entry);
    return pattern.test(entry) && fs.existsSync(abs) && fs.lstatSync(abs).isFile();
  }).length;
}

function findTextLeaks(root, text) {
  const leaks = [];
  const files = listFiles(root);
  for (const rel of files.keys()) {
    const abs = path.join(root, rel);
    if (!/\.(md|toml|json|js|cjs|txt)$/.test(rel)) continue;
    const content = fs.readFileSync(abs, 'utf8');
    const count = content.split(text).length - 1;
    if (count > 0) leaks.push({ path: rel, count });
  }
  return leaks;
}

function findTextLeaksInRoots(root, roots, text) {
  return roots.flatMap((entry) => {
    const abs = path.join(root, entry);
    if (!fs.existsSync(abs)) return [];
    return findTextLeaks(abs, text).map((leak) => ({
      path: `${entry}/${leak.path}`,
      count: leak.count,
    }));
  });
}

function runInstall(configDir, profile) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'safari-gsd-home-'));
  const result = cp.spawnSync(process.execPath, [
    INSTALLER,
    '--codex',
    '--global',
    '--config-dir',
    configDir,
    `--profile=${profile}`,
  ], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: home,
      CODEX_HOME: configDir,
    },
  });
  return { result, home };
}

function writeReport(reportDir, comparison, installOutput) {
  ensureDir(reportDir);
  const reportPath = path.join(reportDir, 'report.md');
  const jsonPath = path.join(reportDir, 'comparison.json');
  fs.writeFileSync(jsonPath, `${JSON.stringify(comparison, null, 2)}\n`);
  fs.writeFileSync(reportPath, renderReport(comparison, installOutput));
  return { reportPath, jsonPath };
}

function renderReport(c, installOutput) {
  const leaks = c.codexInstructionLeaks.length === 0
    ? 'None'
    : c.codexInstructionLeaks.map((l) => `- ${l.path}: ${l.count}`).join('\n');
  return `# Safari GSD Runtime Dry Run

Package version: ${c.packageVersion}

| Check | Value |
|---|---:|
| Live managed files | ${c.liveFiles} |
| Dry-run managed files | ${c.dryFiles} |
| Same files | ${c.same} |
| Changed files | ${c.changed} |
| New files | ${c.newFiles} |
| Live files missing from dry run | ${c.missingFromDry} |
| Live GSD skills | ${c.liveSkillCount} |
| Dry-run GSD skills | ${c.drySkillCount} |
| Live Codex agent TOML files | ${c.liveAgentTomlCount} |
| Dry-run Codex agent TOML files | ${c.dryAgentTomlCount} |
| Live legacy gsd-agents prompts | ${c.liveLegacyGsdAgentCount} |

## Codex Instruction Path Leaks

${leaks}

## Installer Output

\`\`\`text
${installOutput.trim()}
\`\`\`
`;
}

function createBackup(liveDir, backupDir) {
  ensureDir(backupDir);
  const manifest = {
    created: new Date().toISOString(),
    liveDir,
    packageVersion: PACKAGE.version,
    entries: [],
  };

  for (const entry of MANAGED_ENTRIES.concat(['gsd-agents'])) {
    const src = path.join(liveDir, entry);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(backupDir, entry);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(src, dest, { recursive: true, preserveTimestamps: true });
    manifest.entries.push(entry);
  }

  fs.writeFileSync(path.join(backupDir, 'backup-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function restoreBackup(liveDir, backupDir) {
  const manifestPath = path.join(backupDir, 'backup-manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error(`Missing backup manifest: ${manifestPath}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const entry of MANAGED_ENTRIES.concat(['gsd-agents'])) {
    fs.rmSync(path.join(liveDir, entry), { recursive: true, force: true });
  }
  for (const entry of manifest.entries || []) {
    const src = path.join(backupDir, entry);
    const dest = path.join(liveDir, entry);
    if (fs.existsSync(src)) fs.cpSync(src, dest, { recursive: true, preserveTimestamps: true });
  }
  return manifest;
}

function requireLiveWrite(opts) {
  if (!opts.confirmLiveWrite) {
    throw new Error(`${opts.mode} writes to ${opts.liveDir}. Re-run with --confirm-live-write.`);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.mode === 'dry-run') {
    const runRoot = opts.reportDir || path.join(os.tmpdir(), `safari-gsd-runtime-dryrun-${timestamp()}`);
    const dryDir = path.join(runRoot, 'codex-home');
    ensureDir(dryDir);
    const { result } = runInstall(dryDir, opts.profile);
    const output = `${result.stdout || ''}${result.stderr || ''}`;
    if (result.status !== 0) {
      process.stdout.write(output);
      throw new Error(`Dry-run installer failed with exit ${result.status}`);
    }
    const comparison = summarizeComparison(opts.liveDir, dryDir);
    const paths = writeReport(runRoot, comparison, output);
    console.log(`Dry run complete: ${runRoot}`);
    console.log(`Report: ${paths.reportPath}`);
    console.log(`Version: ${comparison.packageVersion}`);
    console.log(`Codex instruction path leaks: ${comparison.codexInstructionLeaks.length}`);
    return;
  }

  if (opts.mode === 'backup') {
    if (!opts.backupDir) throw new Error('backup requires --backup-dir <dir>');
    const manifest = createBackup(opts.liveDir, opts.backupDir);
    console.log(`Backup complete: ${opts.backupDir}`);
    console.log(`Entries: ${manifest.entries.join(', ') || '(none)'}`);
    return;
  }

  if (opts.mode === 'deploy') {
    requireLiveWrite(opts);
    if (!opts.backupDir) throw new Error('deploy requires --backup-dir <dir>');
    const manifest = createBackup(opts.liveDir, opts.backupDir);
    console.log(`Backup complete: ${opts.backupDir}`);
    console.log(`Entries: ${manifest.entries.join(', ') || '(none)'}`);
    const { result } = runInstall(opts.liveDir, opts.profile);
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    if (result.status !== 0) throw new Error(`Live installer failed with exit ${result.status}`);
    console.log(`Deploy complete: ${opts.liveDir}`);
    return;
  }

  if (opts.mode === 'rollback') {
    requireLiveWrite(opts);
    if (!opts.backupDir) throw new Error('rollback requires --backup-dir <dir>');
    const manifest = restoreBackup(opts.liveDir, opts.backupDir);
    console.log(`Rollback complete: ${opts.liveDir}`);
    console.log(`Restored entries: ${(manifest.entries || []).join(', ') || '(none)'}`);
    return;
  }
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err && err.message ? err.message : String(err)}`);
  process.exitCode = 1;
}
