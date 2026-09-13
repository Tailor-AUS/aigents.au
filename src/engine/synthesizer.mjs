/**
 * Aigents.au - Synthesis & Complementarity Engine
 * 
 * Takes an ingested job spec and pairs it with an elite, AI-tooled candidate profile
 * to generate:
 * 1. The Role Complementarity Matrix (Direct relief for overworked engineering teams)
 * 2. Bespoke microsite data (for [company].aigents.au)
 * 3. High-Hook Outbound Application Vectors:
 *    - Vector A: Direct Outreach to Engineering Manager / Lead
 *    - Vector B: ATS Portal Submission Cover Letter
 */

import { generateQrCodeDataUri } from './qr.mjs';
import { renderBriefHtml } from './brief-renderer.mjs';

export async function synthesizePortalBundle(job, candidate) {
  const company = job.company;
  const role = job.role;
  const slug = company.slug;
  const portalUrl = `https://${slug}.aigents.au`;

  // 1. Generate QR Code Data URI
  const qrDataUri = await generateQrCodeDataUri(portalUrl);

  // 2. Generate the Role Complementarity Matrix
  const complementarityMatrix = (job.identifiedOperationalBottlenecks || []).map((bottleneck) => {
    const matchedWorkflow = candidate.aiWorkflowSuite.find(
      (w) => w.name.toLowerCase().includes(bottleneck.complementaryWorkflow.toLowerCase()) ||
             bottleneck.complementaryWorkflow.toLowerCase().includes(w.name.toLowerCase()) ||
             w.category.toLowerCase().includes(bottleneck.requirement.toLowerCase())
    ) || candidate.aiWorkflowSuite[0];

    return {
      advertisedRequirement: bottleneck.requirement,
      teamStrain: bottleneck.teamStrain,
      candidateSolution: {
        candidateName: candidate.name,
        workflowName: matchedWorkflow.name,
        howItWorks: matchedWorkflow.description,
        toolsUsed: matchedWorkflow.tools
      }
    };
  });

  // 3. Outbound Vectors (The PLG Hooks)
  
  // Vector A: Direct to Engineering Manager / Lead (LinkedIn / Direct Email)
  const vectorASubject = `Quick capability brief for your ${role.title} vacancy — ${company.name}`;
  const vectorABody = `Hi [Engineering Lead Name],

I saw your team at ${company.name} is advertising for a ${role.title}. Rather than submitting a generic resume into your HR pile, we built a dedicated engineering portal and AI capability brief specifically for your role:

👉 ${portalUrl}

What this covers:
• Candidate: ${candidate.name} (${candidate.tier}, ${candidate.education.degree}, ${candidate.education.honours}).
• The Complementary Model: How deploying an ATAR 99 engineer equipped with pre-configured AI workflows (automated telemetry parsing, sovereign standards RAG, agentic simulation) absorbs 50% of your team's operational backlog on Day 1.
• Interactive AIgent: Test our technical Q&A agent grounded directly in ${company.name}'s problem domain on the page.

If you're open to an 8–12 week high-impact student placement to take the operational grunt work off your senior engineers, you can review the dossier and lock in a 15-min technical chat directly at ${portalUrl}.

Best regards,

Knox Hart
Aigents.au — Sovereign Engineering Talent Substrate
${portalUrl}`;

  // Vector B: ATS Portal Submission (Seek / Workday / LinkedIn Easy Apply)
  const vectorBSubject = `${role.title} — ${candidate.name} (${candidate.tier} | First Class Honours)`;
  const vectorBBody = `ATTENTION: TECHNICAL HIRING TEAM / ENGINEERING LEAD
RE: ${role.title} — ${company.name}

================================================================================
INTERACTIVE CAPABILITY BRIEF & TECHNICAL AGENT:
👉 ${portalUrl}
(Please view the interactive portal or scan the QR code on our 1-page attachment)
================================================================================

Dear ${company.name} Engineering Team,

Rather than submitting a standard resume, I am putting forward an executive engineering brief specifically tailored to ${company.name}'s ${role.title} role.

Candidate Snapshot:
• Name: ${candidate.name}
• Academic Distinction: ATAR ${candidate.tier} (Top 1% statewide academic rank), ${candidate.education.degree} (${candidate.education.honours}).
• Core Strength: High-horsepower quantitative problem-solving combined with production-grade AI workflow harnesses.

Why This Placement is Complementary to Your Team:
Senior engineers spend up to 50% of their week on repetitive data cleaning, manual compliance cross-referencing, and boilerplate scripting. I arrive equipped with autonomous AI workflows (including Python/Polars telemetry pipelines and sovereign standards RAG) designed to absorb this operational drag from Day 1 without senior hand-holding.

Key Verified Proof Projects:
1. Automated Heavy Asset Telemetry Parser: Ingestion pipeline handling 500k+ sensor points/sec, cutting diagnostic time by 80%.
2. Sovereign Australian Standards RAG: Instant clause retrieval and automated compliance auditing across AS/NZS standards.
3. Automated Project Controls: Voice-to-task synthesis auto-updating FMEA risk registers and action logs.

Availability:
Available for an immediate 8–12 week high-impact vacation sprint or flexible semester co-op (Brisbane / Hybrid / Site Travel).

You can review our full Role Complementarity Matrix and test our live technical AIgent at:
${portalUrl}

I welcome the opportunity for a 15-minute technical interview.

Sincerely,

${candidate.name}
${candidate.title}
${portalUrl}`;

  // 4. Interactive QnA pairs
  const interactiveQna = [
    {
      question: `How does ${candidate.name} provide immediate value to ${company.name}'s ${role.department} team without senior hand-holding?`,
      answer: `${candidate.name} arrives equipped with production-grade AI workflow harnesses (including Python/Polars telemetry pipelines and standards RAG). Instead of spending weeks asking senior engineers where documentation or baseline scripts are, Kate uses agentic tools to ingest codebase specs and synthesize data, escalating only true first-principles engineering decisions.`
    },
    {
      question: `What specific tools and frameworks does ${candidate.name} bring for telemetry and sensor data?`,
      answer: `Kate utilizes automated Python, Polars, and DuckDB ingestion scripts augmented with anomaly detection models. In past project work, this pipeline processed 500k+ sensor points/sec for heavy rotating equipment, cutting diagnostic time by 80%.`
    },
    {
      question: `How does ${candidate.name} handle Australian Standards and safety compliance?`,
      answer: `Rather than manually leafing through hundreds of pages of AS/NZS standards, Kate leverages a sovereign, local vector RAG database to query relevant clauses, cross-reference design constraints, and produce verified, citation-backed audit trails in minutes.`
    },
    {
      question: `What is the proposed engagement structure for this placement?`,
      answer: `${candidate.name} is available for an 8–12 week high-impact sprint (vacation work) or a flexible semester-aligned co-op. This provides ${company.name} with elite engineering horsepower on backlog projects with zero long-term headcount liability.`
    }
  ];

  const bundle = {
    meta: {
      generatedAt: new Date().toISOString(),
      slug: slug,
      portalDomain: `${slug}.aigents.au`,
      companyName: company.name,
      roleTitle: role.title
    },
    hero: {
      eyebrow: `${candidate.name} × ${company.name}`,
      headline: `The Complementary Engineering Asset for ${company.name}'s ${role.title}`,
      subheadline: `${candidate.tier} Analytical Rigor paired with Enterprise AI Workflows — engineered to absorb operational drag and accelerate ${company.name}'s technical roadmap from Day 1.`,
      metrics: [
        { label: "Academic Rank", value: candidate.tier },
        { label: "Onboarding Lag", value: "3 Days (vs 3 Months)" },
        { label: "Workflow Velocity", value: "5x Senior Grunt-Work Relief" },
        { label: "Engagement", value: role.duration }
      ]
    },
    roleContext: {
      roleTitle: role.title,
      department: role.department,
      location: role.location,
      duration: role.duration,
      companyMission: company.mission,
      strategicPriorities: company.strategicPriorities
    },
    complementarityMatrix,
    interactiveQna,
    candidateSnapshot: {
      name: candidate.name,
      title: candidate.title,
      tier: candidate.tier,
      education: candidate.education,
      technicalSkills: candidate.technicalSkills,
      proofProjects: candidate.proofProjects
    },
    qrDataUri,
    outboundPacket: {
      portalUrl: portalUrl,
      vectorA: {
        channel: "Direct Email / LinkedIn InMail to Engineering Lead",
        subject: vectorASubject,
        body: vectorABody
      },
      vectorB: {
        channel: "ATS Portal Submission (Seek / Workday / LinkedIn)",
        subject: vectorBSubject,
        body: vectorBBody
      }
    },
    plgBanner: {
      title: "Powered by Aigents.au",
      description: `Aigents.au equips Australia's top 1% STEM undergraduates with enterprise AI workflow harnesses. Deploy high-velocity, low-friction engineering cohorts across your organisation.`,
      ctaText: "Explore the Undergrad Talent Pool",
      ctaUrl: "https://aigents.au"
    }
  };

  bundle.briefHtml = renderBriefHtml(bundle, qrDataUri);

  return bundle;
}
