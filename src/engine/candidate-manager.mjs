/**
 * Candidate Profile Generator & Persistence
 * 
 * Takes form data from the /build studio, persists the candidate into data/candidates/[id].json,
 * and sets up their AIgent personality and workflow suite.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

export function slugify(name) {
  return String(name || 'fellow')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function registerCandidate(formData) {
  const name = formData.name || 'Anonymous Fellow';
  const id = slugify(name);
  const candidatePath = path.join(ROOT_DIR, 'data', 'candidates', `${id}.json`);

  const candidateProfile = {
    id: id,
    name: name,
    email: formData.email || '',
    phone: formData.phone || '',
    title: `AI-Tooled ${formData.discipline || 'Engineering'} Fellow`,
    tier: formData.atar ? `ATAR ${formData.atar}` : `WAM ${formData.wam || '85+'}`,
    status: "Active Fellow — Guaranteed Retainer Enrolled",
    weeklyRetainer: "$750/week Base + $45–$55/hr Placement",
    education: {
      degree: formData.degree || 'Bachelor of Engineering (Honours)',
      discipline: formData.discipline || 'Mechanical & Systems Engineering',
      university: formData.university || 'University of Queensland',
      graduationYear: formData.gradYear || '2026',
      honours: "First Class Honours Track",
      academicHighlights: [
        formData.atar ? `ATAR ${formData.atar} (State Merit Rank)` : `Academic WAM ${formData.wam || '85+'}`,
        "Dean's Commendation for Academic Excellence",
        "Aigents.au Enterprise AI Workflow Fellow"
      ]
    },
    transcriptSubmitted: true,
    transcriptDocName: formData.transcriptName || 'Academic_Transcript_Verified.pdf',
    submittedAt: new Date().toISOString(),
    valueProposition: formData.bio || "High-horsepower analytical foundation paired with autonomous AI workflows to eliminate senior engineering drag from Day 1.",
    aiWorkflowSuite: [
      {
        category: "Telemetry & Data Pipelines",
        name: "Automated Anomaly & Telemetry Parsing",
        description: "Python + Polars data pipelines augmented with agentic anomaly detection to wrangle dirty sensor logs and time-series data without manual data cleaning drag.",
        tools: ["Python", "Polars", "Pandas", "DuckDB", "Agentic Pipelines"]
      },
      {
        category: "Standards & Compliance",
        name: "Sovereign Regulatory & Standards RAG",
        description: "Vectorised regulatory database over AS/NZS, ISO, and site-specific safety standards for instant clause retrieval, cross-referencing, and automated compliance auditing.",
        tools: ["Vector RAG", "Embedding Search", "Australian Standards (AS/NZS)", "ISO Standards"]
      },
      {
        category: "Simulation & Modeling",
        name: "Agentic Code Loops & Digital Twins",
        description: "AI-assisted parameter sweeps, finite element analysis (FEA) verification scripts, and automated test harness generation.",
        tools: ["MATLAB", "Python", "CAD Automation", "Automated Testing"]
      },
      {
        category: "Operational PMO & Reporting",
        name: "Voice-to-Task & Shift Handoff Synthesis",
        description: "Automated transcription and structured action-item extraction from technical discussions, auto-updating Jira/project risk registers.",
        tools: ["Whisper", "Structured JSON Extraction", "Project Controls", "HAZOP/FMEA Logs"]
      }
    ],
    technicalSkills: {
      languages: (formData.languages || "Python, MATLAB, SQL, C++").split(',').map(s => s.trim()),
      engineeringTools: (formData.tools || "SolidWorks, CAD, FEA, Git").split(',').map(s => s.trim()),
      aiTooling: ["Agentic Coding Loops", "Standards Vector RAG", "Prompt Harnessing", "Function Calling", "Local Embeddings"]
    },
    proofProjects: [
      {
        name: formData.projectTitle || "Automated Engineering Telemetry & Diagnostics Pipeline",
        summary: formData.projectSummary || "Engineered an automated data pipeline and agentic parser to clean raw sensor logs, detect anomalies, and auto-generate compliance summaries.",
        impact: "Absorbs 15+ hours per week of manual senior engineering data wrangling."
      }
    ],
    contact: {
      availability: "Immediate / Vacation / Semester Co-op",
      location: formData.location || "Brisbane / Gold Coast / WA Fly-In Fly-Out"
    }
  };

  await fs.writeFile(candidatePath, JSON.stringify(candidateProfile, null, 2), 'utf8');
  return candidateProfile;
}
