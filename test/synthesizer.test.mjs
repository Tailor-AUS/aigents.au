import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { synthesizePortalBundle } from '../src/engine/synthesizer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('synthesizer accurately produces Role Complementarity Matrix, QR, Brief, and Dual Outbound Vectors', async () => {
  const candidate = JSON.parse(await fs.readFile(path.join(ROOT_DIR, 'data', 'candidates', 'kate-corcoran.json'), 'utf8'));
  const job = JSON.parse(await fs.readFile(path.join(ROOT_DIR, 'data', 'jobs', 'sample-industrial-systems.json'), 'utf8'));

  const bundle = await synthesizePortalBundle(job, candidate);

  // Assert basic metadata
  assert.equal(bundle.meta.slug, 'apex-energy');
  assert.equal(bundle.meta.portalDomain, 'apex-energy.aigents.au');

  // Assert hero and metrics
  assert.ok(bundle.hero.headline.includes('Apex Clean Energy'));
  assert.equal(bundle.hero.metrics[0].value, 'ATAR 99.00');

  // Assert QR Code & Brief HTML
  assert.ok(bundle.qrDataUri.startsWith('data:image/png;base64,'));
  assert.ok(bundle.briefHtml.includes('Scan for Interactive Portal'));

  // Assert Role Complementarity Matrix
  assert.equal(bundle.complementarityMatrix.length, 4);
  assert.equal(bundle.complementarityMatrix[0].candidateSolution.candidateName, 'Kate Corcoran');

  // Assert Outbound Packet Dual Vectors
  assert.ok(bundle.outboundPacket.vectorA.subject.includes('Apex Clean Energy'));
  assert.ok(bundle.outboundPacket.vectorA.body.includes('https://apex-energy.aigents.au'));
  assert.ok(bundle.outboundPacket.vectorB.body.includes('https://apex-energy.aigents.au'));

  // Assert QnA pairs
  assert.ok(bundle.interactiveQna.length >= 4);
});
