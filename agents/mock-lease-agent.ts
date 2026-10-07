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
    { field: 'unit_id', page: 1, text: `Detected unit reference: ${unitId}.`, source: 'mock lease text extraction', confidence: 0.74 },
    { field: 'landlord', page: 1, text: 'Landlord identified as Marina Crest Holdings W.L.L.', source: 'mock lease text extraction', confidence: 0.82 },
    { field: 'tenant', page: 1, text: 'Tenant identified as Aisha Rahman.', source: 'mock lease text extraction', confidence: 0.82 },
    { field: 'monthly_rent', page: 2, text: 'Monthly rent stated as QAR 3,500.00.', source: 'mock lease text extraction', confidence: 0.9 },
    { field: 'security_deposit', page: 2, text: 'Security deposit stated as QAR 3,500.00 (equal to one month rent).', source: 'mock lease text extraction', confidence: 0.9 },
    { field: 'escalation_clause', page: 3, text: 'Rent escalation clause states a fixed 5% annual increase, applied every 12 months.', source: 'mock lease text extraction', confidence: 0.88 },
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
