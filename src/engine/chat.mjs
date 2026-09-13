/**
 * Aigents.au - Interactive AIgent Technical Q&A Handler
 * 
 * Provides domain-grounded, instant technical responses to questions asked
 * by hiring managers and recruiters visiting [company].aigents.au.
 */

export function handleChatQuery(query, bundle) {
  const q = String(query || '').toLowerCase().trim();
  const { candidateSnapshot, roleContext, complementarityMatrix, meta } = bundle;

  // 1. Direct match with pre-computed QnA bank
  for (const item of bundle.interactiveQna) {
    const itemWords = item.question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchCount = itemWords.filter(w => q.includes(w)).length;
    if (matchCount >= 2) {
      return {
        answer: item.answer,
        source: 'verified_knowledge_base'
      };
    }
  }

  // 2. Telemetry / Data / Python queries
  if (q.includes('telemetry') || q.includes('data') || q.includes('python') || q.includes('sensor') || q.includes('code')) {
    return {
      answer: `${candidateSnapshot.name} is proficient in Python, Polars, Pandas, and DuckDB. She has developed agentic anomaly detection pipelines capable of processing 500,000+ sensor data points per second for heavy rotating assets. She can immediately automate ${meta.companyName}'s telemetry log cleaning and diagnostic tasks.`,
      source: 'technical_profile'
    };
  }

  // 3. Standards / Compliance / AS/NZS / ISO
  if (q.includes('standard') || q.includes('compliance') || q.includes('as/nzs') || q.includes('iso') || q.includes('safety') || q.includes('regulation')) {
    return {
      answer: `Rather than spending days manually reviewing regulatory documents, ${candidateSnapshot.name} uses a sovereign, local vector RAG database of AS/NZS and ISO standards. She queries clauses and verifies design constraints in minutes with full citation audit trails.`,
      source: 'compliance_workflow'
    };
  }

  // 4. Availability / Location / Start date / Duration
  if (q.includes('start') || q.includes('available') || q.includes('when') || q.includes('location') || q.includes('fifo') || q.includes('duration') || q.includes('weeks')) {
    return {
      answer: `${candidateSnapshot.name} is available for an immediate 8–12 week high-impact sprint (vacation work) or a flexible semester co-op. She is based in Brisbane / Gold Coast and is available for site travel and remote/hybrid work for ${meta.companyName}.`,
      source: 'logistics_and_terms'
    };
  }

  // 5. ATAR / Academic credentials / University
  if (q.includes('atar') || q.includes('grade') || q.includes('uni') || q.includes('degree') || q.includes('honour') || q.includes('gpa')) {
    return {
      answer: `${candidateSnapshot.name} achieved an ATAR of ${candidateSnapshot.tier} (placing her in the top 1% academically in the state). She is pursuing her ${candidateSnapshot.education.degree} on the ${candidateSnapshot.education.honours}, holding Dean's Commendations for Academic Excellence.`,
      source: 'academic_credentials'
    };
  }

  // 6. Default fallback
  return {
    answer: `${candidateSnapshot.name} combines top-tier analytical horsepower (${candidateSnapshot.tier}) with pre-configured AI workflow harnesses designed to solve operational backlogs for ${meta.companyName}'s ${roleContext.roleTitle} team. You can schedule a 15-minute technical chat directly on this page to discuss her placement.`,
    source: 'general_dossier'
  };
}
