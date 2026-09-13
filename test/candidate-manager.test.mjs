import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerCandidate, slugify } from '../src/engine/candidate-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('candidate manager correctly registers student, compiles AIgent profile, and sets guaranteed retainer', async () => {
  const testStudent = {
    name: 'Alex Vance',
    email: 'a.vance@uq.net.au',
    university: 'University of Queensland',
    discipline: 'Mechatronics & Robotics',
    atar: '99.40',
    wam: '88.2',
    languages: 'Python, C++, Rust',
    tools: 'ROS2, SolidWorks, PyTorch',
    projectTitle: 'Autonomous LiDAR SLAM Rover',
    projectSummary: 'Engineered autonomous SLAM navigation and sensor calibration.',
    transcriptName: 'Alex_Vance_Transcript_UQ.pdf'
  };

  const profile = await registerCandidate(testStudent);

  assert.equal(profile.id, 'alex-vance');
  assert.equal(profile.name, 'Alex Vance');
  assert.equal(profile.tier, 'ATAR 99.40');
  assert.equal(profile.transcriptSubmitted, true);
  assert.ok(profile.weeklyRetainer.includes('$750/week Base'));
  assert.equal(profile.aiWorkflowSuite.length, 4);

  const savedFilePath = path.join(ROOT_DIR, 'data', 'candidates', 'alex-vance.json');
  const savedRaw = await fs.readFile(savedFilePath, 'utf8');
  const savedData = JSON.parse(savedRaw);
  assert.equal(savedData.name, 'Alex Vance');

  await fs.unlink(savedFilePath);
});

test('slugify handles symbols and spacing correctly', () => {
  assert.equal(slugify('Sarah Connor (Honours)'), 'sarah-connor-honours');
  assert.equal(slugify('   David   O\'Connor  '), 'david-o-connor');
});
