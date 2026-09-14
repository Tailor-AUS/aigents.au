export class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function textField(body, field, max, required = false) {
  const value = body[field] ?? '';
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new InputError(`Check the ${field} field.`);
  const clean = value.trim();
  if (required && !clean) throw new InputError(`Please complete the ${field} field.`);
  return clean;
}
export function normalizeEmail(value) {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw new InputError('Enter a valid email address.');
  return value.trim().toLowerCase();
}
export function normalizeProfile(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('Enter your profile details.');
  const profile = {};
  const limits = { name: 100, university: 150, discipline: 100, wam: 40, atar: 20, languages: 500, tools: 500, projectTitle: 180, projectSummary: 4000, transcriptName: 200, bio: 1500, location: 180, availability: 300 };
  for (const [field, max] of Object.entries(limits)) profile[field] = textField(body, field, max, ['name', 'university', 'discipline', 'wam'].includes(field));
  if (body.sharingEnabled !== undefined && typeof body.sharingEnabled !== 'boolean') throw new InputError('Choose whether to share your profile.');
  profile.sharingEnabled = body.sharingEnabled === true;
  return profile;
}
export function publicProfile(profile) {
  return Object.fromEntries(['id', 'name', 'university', 'discipline', 'languages', 'tools', 'projectTitle', 'projectSummary', 'bio', 'location', 'availability', 'updatedAt'].map(field => [field, profile[field] || '']));
}
export function normalizeEnquiry(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('Enter your project details.');
  if (body.consent !== true) throw new InputError('Please agree to share this enquiry with Aigents and the selected student.');
  if (body.website) throw new InputError('Unable to submit this enquiry.');
  const enquiry = { email: normalizeEmail(body.email) };
  const limits = { company: 180, contactName: 100, projectTitle: 180, description: 5000, skills: 1000, location: 180, budget: 180, timeline: 180 };
  for (const [field, max] of Object.entries(limits)) enquiry[field] = textField(body, field, max, ['company', 'contactName', 'projectTitle', 'description'].includes(field));
  return enquiry;
}
export function slugify(name) { return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
