import type { EvidenceItem, LeaseExtraction } from '@/types/domain';

function detectUnitFromText(text: string): string | undefined {
  const matches = text.match(/MC-[A-Z]-\d{4}/g) ?? [];
  return matches[0];
}

export async function extractLease(document: { text?: string; unit_id?: string } | string): Promise<LeaseExtraction> {
  const text = typeof document === 'string' ? document : document.text ?? '';
  if (!text.trim()) {
    throw new Error('No lease text was supplied for extraction.');
  }

  const requestedUnitId = typeof document === 'object' ? document.unit_id : undefined;
  const unitId = requestedUnitId?.trim() || detectUnitFromText(text) || 'MC-B-1204';
  const evidence: EvidenceItem[] = [
    { field: 'unit_id', page: 1, text: `Illustrative demo evidence: Lease page 1 shows the unit reference "${unitId}" in the leased property schedule.`, source: 'mock lease text extraction', confidence: 0.74 },
    { field: 'landlord', page: 1, text: 'Illustrative demo evidence: Lease page 1 identifies the landlord as Marina Crest Holdings W.L.L.', source: 'mock lease text extraction', confidence: 0.82 },
    { field: 'tenant', page: 1, text: 'Illustrative demo evidence: Lease page 1 identifies the tenant as Aisha Rahman.', source: 'mock lease text extraction', confidence: 0.82 },
    { field: 'commencement_date', page: 1, text: 'Illustrative demo evidence: Lease page 1 states the commencement date as 2025-01-01.', source: 'mock lease text extraction', confidence: 0.86 },
    { field: 'expiry_date', page: 1, text: 'Illustrative demo evidence: Lease page 1 states the expiry date as 2027-12-31.', source: 'mock lease text extraction', confidence: 0.86 },
    { field: 'term_months', page: 1, text: 'Illustrative demo evidence: Lease page 1 states the term as 36 months, beginning 2025-01-01 and ending 2027-12-31.', source: 'mock lease text extraction', confidence: 0.86 },
    { field: 'monthly_rent', page: 2, text: 'Illustrative demo evidence: Lease page 2 states the monthly rent as QAR 3,500.00.', source: 'mock lease text extraction', confidence: 0.9 },
    { field: 'annual_rent', page: 2, text: 'Illustrative demo evidence: Lease page 2 calculates annual rent as QAR 42,000.00, based on 12 months × QAR 3,500.00.', source: 'mock lease text extraction', confidence: 0.9 },
    { field: 'deposit_amount', page: 2, text: 'Illustrative demo evidence: Lease page 2 states the security deposit as QAR 3,500.00, equal to one month of rent.', source: 'mock lease text extraction', confidence: 0.9 },
    { field: 'security_deposit', page: 2, text: 'Illustrative demo evidence: Lease page 2 states the security deposit as QAR 3,500.00, equal to one month of rent.', source: 'mock lease text extraction', confidence: 0.9 },
    { field: 'payment_frequency', page: 2, text: 'Illustrative demo evidence: Lease page 2 states rent is payable on a monthly basis.', source: 'mock lease text extraction', confidence: 0.82 },
    { field: 'escalation_clause', page: 3, text: 'Illustrative demo evidence: Lease page 3 states a fixed 5% annual increase, applied every 12 months.', source: 'mock lease text extraction', confidence: 0.88 },
    { field: 'renewal', page: 3, text: 'Illustrative demo evidence: Lease page 3 provides automatic renewal for successive 12-month periods unless either party gives 90 days written notice.', source: 'mock lease text extraction', confidence: 0.83 },
    { field: 'termination', page: 3, text: 'Illustrative demo evidence: Lease page 3 states termination for convenience requires 30 days written notice.', source: 'mock lease text extraction', confidence: 0.83 },
  ];

  return {
    unit_id: unitId,
    landlord: { name: 'Marina Crest Holdings W.L.L.', present: true, signed: true },
    tenant: { name: 'Aisha Rahman', present: true, signed: true },
    commencement_date: '2025-01-01',
    expiry_date: '2027-12-31',
    term_months: 36,
    stated_term_months: 36,
    monthly_rent: 3500,
    annual_rent: 42000,
    deposit_amount: 3500,
    currency: 'QAR',
    payment_frequency: 'monthly',
    security_deposit: 3500,
    escalation_clause: {
      is_defined: true,
      mechanism: '5% annual fixed escalation',
      percentage: 5,
      evidence,
    },
    renewal_terms: 'Automatic renewal for successive 12-month periods unless either party gives 90 days written notice.',
    termination_terms: 'Termination for convenience requires 30 days written notice.',
    missing_fields: [],
    contradictions: [],
    review_flags: ['Mock AI output for a demo workflow; verify all extracted facts before approval.'],
    evidence,
    confidence: 0.84,
    is_mock: true,
    source_note: 'Demo-only lease extraction. This is illustrative output and not a verified business record.',
  };
}
