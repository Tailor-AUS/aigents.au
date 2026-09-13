#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { synthesizePortalBundle } from './engine/synthesizer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function main() {
  const [command, slug] = process.argv.slice(2);

  const candidatePath = path.join(ROOT_DIR, 'data', 'candidates', 'kate-corcoran.json');
  const candidate = JSON.parse(await fs.readFile(candidatePath, 'utf8'));

  const jobsDir = path.join(ROOT_DIR, 'data', 'jobs');
  const jobFiles = await fs.readdir(jobsDir);
  const jobs = {};

  for (const file of jobFiles) {
    if (file.endsWith('.json')) {
      const jobData = JSON.parse(await fs.readFile(path.join(jobsDir, file), 'utf8'));
      jobs[jobData.company.slug] = jobData;
    }
  }

  if (command === 'list') {
    console.log('\n--- Ingested Target Jobs ---');
    for (const [s, j] of Object.entries(jobs)) {
      console.log(`• [${s}] ${j.company.name} — ${j.role.title}`);
    }
    console.log(`\nActive Flagship Candidate: ${candidate.name} (${candidate.tier}, ${candidate.education.degree})\n`);
    return;
  }

  if (command === 'packet') {
    const targetSlug = slug || Object.keys(jobs)[0];
    if (!jobs[targetSlug]) {
      console.error(`Error: Company slug "${targetSlug}" not found. Run 'list' to see available slugs.`);
      process.exit(1);
    }
    const bundle = await synthesizePortalBundle(jobs[targetSlug], candidate);
    const { vectorA, vectorB, portalUrl } = bundle.outboundPacket;

    console.log('\n================================================================');
    console.log(`🎯 AIGENTS.AU OUTBOUND APPLICATION PACKET: ${bundle.meta.companyName}`);
    console.log(`PORTAL URL: ${portalUrl}`);
    console.log('================================================================\n');

    console.log('----------------------------------------------------------------');
    console.log(`VECTOR A: ${vectorA.channel}`);
    console.log('----------------------------------------------------------------');
    console.log(`SUBJECT: ${vectorA.subject}\n`);
    console.log(vectorA.body);
    console.log('\n----------------------------------------------------------------');
    console.log(`VECTOR B: ${vectorB.channel}`);
    console.log('----------------------------------------------------------------');
    console.log(`SUBJECT: ${vectorB.subject}\n`);
    console.log(vectorB.body);
    console.log('\n================================================================\n');
    return;
  }

  if (command === 'brief') {
    const targetSlug = slug || Object.keys(jobs)[0];
    if (!jobs[targetSlug]) {
      console.error(`Error: Company slug "${targetSlug}" not found. Run 'list' to see available slugs.`);
      process.exit(1);
    }
    const bundle = await synthesizePortalBundle(jobs[targetSlug], candidate);
    const outPath = path.join(ROOT_DIR, `brief-${targetSlug}.html`);
    await fs.writeFile(outPath, bundle.briefHtml, 'utf8');
    console.log(`\n✅ 1-Page Printable Brief written to: ${outPath}`);
    console.log(`Open in browser to print/save as PDF (A4 with QR code pointing to ${bundle.outboundPacket.portalUrl})\n`);
    return;
  }

  if (command === 'matrix') {
    const targetSlug = slug || Object.keys(jobs)[0];
    if (!jobs[targetSlug]) {
      console.error(`Error: Company slug "${targetSlug}" not found. Run 'list' to see available slugs.`);
      process.exit(1);
    }
    const bundle = await synthesizePortalBundle(jobs[targetSlug], candidate);
    console.log(`\nRole Complementarity Matrix for: ${bundle.meta.companyName} (${bundle.meta.roleTitle})\n`);
    for (const row of bundle.complementarityMatrix) {
      console.log(`[Advertised Requirement]: ${row.advertisedRequirement}`);
      console.log(`[Team Bottleneck]:        ${row.teamStrain}`);
      console.log(`[Candidate Solution]:     ${row.candidateSolution.workflowName}`);
      console.log(`[Tools]:                  ${row.candidateSolution.toolsUsed.join(', ')}`);
      console.log('----------------------------------------------------------------');
    }
    return;
  }

  console.log(`
Usage:
  node src/cli.mjs list             # List available companies and active candidates
  node src/cli.mjs packet <slug>    # View Vector A (Direct Email) and Vector B (ATS Cover Letter)
  node src/cli.mjs brief <slug>     # Generate 1-Page Printable HTML/PDF Brief with QR Code
  node src/cli.mjs matrix <slug>    # View Role Complementarity Matrix
`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
