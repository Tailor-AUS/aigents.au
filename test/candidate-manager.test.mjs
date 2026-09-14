import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProfile, normalizeEnquiry, publicProfile, normalizeEmail } from '../src/engine/candidate-manager.mjs';

const details = { name: 'Example Student', university: 'Example University', discipline: 'Mechanical Engineering', wam: '6/7 GPA' };
test('student details do not acquire invented credentials or expose private grades and contact fields', () => {
  const profile = normalizeProfile(details);
  assert.equal(profile.tools, '');
  assert.equal(profile.projectSummary, '');
  assert.equal(profile.sharingEnabled, false);
  assert.equal(profile.status, undefined);
  const shared = publicProfile({ ...profile, id: 'example-id', email: 'private@example.invalid', atar: '99', transcriptName: 'private.pdf', password: 'secret', recoveryHash: 'secret' });
  for (const field of ['email', 'atar', 'wam', 'transcriptName', 'password', 'recoveryHash']) assert.equal(Object.hasOwn(shared, field), false, field);
});
test('malformed and excessively large profile fields cannot reach durable storage', () => {
  assert.throws(() => normalizeProfile({ ...details, sharingEnabled: 'false' }));
  assert.throws(() => normalizeProfile({ ...details, name: { bad: 'input' } }));
  assert.throws(() => normalizeProfile({ ...details, projectSummary: 'x'.repeat(4001) }));
  assert.throws(() => normalizeEmail('student@example.com\nInjected: header'));
  assert.equal(normalizeEmail(' Student@Example.COM '), 'student@example.com');
});
test('an employer must provide contact details and explicit consent', () => {
  const enquiry = { company: 'Example', contactName: 'Test Contact', email: 'test@example.invalid', projectTitle: 'Data analysis', description: 'Paid engineering project', consent: true };
  assert.equal(normalizeEnquiry(enquiry).projectTitle, 'Data analysis');
  assert.throws(() => normalizeEnquiry({ ...enquiry, consent: false }));
  assert.throws(() => normalizeEnquiry({ ...enquiry, email: '' }));
  assert.throws(() => normalizeEnquiry({ ...enquiry, website: 'bot-content' }));
});
