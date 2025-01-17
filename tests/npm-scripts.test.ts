import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import * as npm from '../src/manifest/index.js';
import { resolve, join } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';
import { getManifest } from './helpers/index.js';

const cwd = resolve('tests/fixtures/npm-scripts');
const manifest = getManifest(cwd);

test('Referenced dependencies in npm scripts', async () => {
  const config = {
    manifest,
    isProduction: false,
    isStrict: false,
    dir: cwd,
    cwd,
  };

  const { dependencies, peerDependencies, installedBinaries } = await npm.findDependencies(config);

  assert.deepEqual(dependencies, [
    'bin:nodemon',
    join(cwd, 'script.js'),
    'bin:rm',
    'bin:dotenv',
    'bin:nx',
    'bin:pm2',
    'bin:pm2-dev',
    'bin:eslint',
    'bin:bash',
    'bin:package',
  ]);

  const expectedPeerDependencies = new Map();
  expectedPeerDependencies.set('pm2-peer-dep', new Set(['pm2']));

  assert.deepEqual(peerDependencies, expectedPeerDependencies);

  assert.deepEqual(
    installedBinaries,
    new Map([
      ['pm2', new Set(['pm2', 'pm2-dev', 'pm2-docker', 'pm2-runtime'])],
      ['pm2-dev', new Set(['pm2'])],
      ['pm2-docker', new Set(['pm2'])],
      ['pm2-runtime', new Set(['pm2'])],
      ['nx', new Set(['nx'])],
      ['package', new Set(['package-cli'])],
      ['package-cli', new Set(['package'])],
      ['unused', new Set(['unused'])],
      ['eslint', new Set(['eslint', 'eslint-v6', 'eslint-v7', 'eslint-v8'])],
      ['eslint-v6', new Set(['eslint'])],
      ['eslint-v7', new Set(['eslint'])],
      ['eslint-v8', new Set(['eslint'])],
    ])
  );
});

test('Unused dependencies in npm scripts', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.dependencies['package.json']['express']);

  assert(issues.devDependencies['package.json']['unused']);
  assert(!issues.devDependencies['package.json']['eslint-v6']);
  assert(!issues.devDependencies['package.json']['eslint-v7']);
  assert(!issues.devDependencies['package.json']['eslint-v8']);

  assert(issues.unlisted['package.json']['bin:nodemon']);
  assert(issues.unlisted['package.json']['bin:dotenv']);
  assert(!issues.unlisted['package.json']['bin:rm']);
  assert(!issues.unlisted['package.json']['bin:bash']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    devDependencies: 1,
    unlisted: 2,
    processed: 1,
    total: 1,
  });
});

test('Unused dependencies in npm scripts (strict)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
    isStrict: true,
  });

  assert(issues.dependencies['package.json']['express']);
  assert(issues.dependencies['package.json']['unused-peer-dep']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 2,
    processed: 1,
    total: 1,
  });
});
