'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LeaseRecord } from '@/types/domain';

const fields = [
  ['landlord', 'Landlord', 'text'], ['tenant', 'Tenant', 'text'], ['unit_id', 'Unit ID', 'text'],
  ['commencement_date', 'Commencement date', 'date'], ['expiry_date', 'Expiry date', 'date'], ['term_months', 'Term (months)', 'number'],
  ['monthly_rent', 'Monthly rent', 'number'], ['annual_rent', 'Annual rent', 'number'], ['deposit_amount', 'Deposit amount', 'number'],
  ['payment_frequency', 'Rent frequency', 'text'], ['escalation', 'Escalation', 'text'], ['renewal', 'Renewal', 'text'], ['termination', 'Termination', 'text'],
] as const;

function fieldValue(lease: LeaseRecord, key: string): string {
  const value: unknown = key === 'landlord' ? lease.landlord.name : key === 'tenant' ? lease.tenant.name
    : key === 'escalation' ? lease.escalation_clause.mechanism ?? (lease.escalation_clause.is_defined ? 'Defined' : 'Not specified')
      : key === 'renewal' ? lease.renewal_terms ?? '' : key === 'termination' ? lease.termination_terms ?? ''
        : key === 'payment_frequency' ? lease.payment_frequency ?? ''
          : key === 'deposit_amount' ? lease.deposit_amount ?? lease.security_deposit : lease[key as keyof LeaseRecord];
  return value === undefined || value === null ? '' : String(value);
}

export default function LeaseReview({ lease, auditCount }: { lease: LeaseRecord; auditCount: number }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(([key]) => [key, fieldValue(lease, key)])));
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function act(path: string, method = 'POST', body?: unknown) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'Review action failed.');
      setMessage(path.endsWith('/reject') ? 'Lease rejected. Unit remains available.' : path.endsWith('/accept') ? 'Lease accepted and unit marked occupied.' : 'Corrections saved and validation refreshed.');
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Review action failed.'); }
    finally { setBusy(false); }
  }
  const editable = lease.review_status === 'PENDING_REVIEW';
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold text-navy">AI Extraction Review</h2>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lease.review_status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : lease.review_status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>{lease.review_status.replace('_', ' ')}</span></div>
    {editable && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Human review required. The unit remains available until you accept this lease.</p>}
    <p className="mt-2 text-xs text-slate-500">Illustrative demo extraction and evidence; these values are not verified lease facts.</p>
    <div className="mt-4 grid gap-3 md:grid-cols-2">{fields.map(([key, label, type]) => {
      const evidenceKey = key === 'deposit_amount' ? 'security_deposit' : key === 'escalation' ? 'escalation_clause' : key;
      const evidence = lease.evidence.find((item) => item.field === evidenceKey);
      const textValue = values[key];
      return <label key={key} className="rounded-xl border border-slate-200 p-3"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <input aria-label={label} disabled={!editable || key === 'unit_id'} type={type} value={textValue} onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-900 disabled:bg-slate-50" />
        <span className="mt-1 block text-xs text-slate-500">Review: {textValue ? 'Needs human confirmation' : 'Missing value'}</span>
        <span className="mt-1 block text-xs text-slate-500">{evidence ? `Demo evidence${evidence.page ? ` · page ${evidence.page}` : ''}: ${evidence.text}` : 'No source evidence available.'}</span>
      </label>;
    })}</div>
    {editable && <div className="mt-5 flex flex-wrap gap-2">
      <button disabled={busy} onClick={() => act(`/api/leases/${lease.lease_id}`, 'PATCH', Object.fromEntries(fields.filter(([key]) => key !== 'unit_id').map(([key]) => [key, key === 'landlord' ? { ...lease.landlord, name: values[key] } : key === 'tenant' ? { ...lease.tenant, name: values[key] } : key === 'term_months' || key === 'monthly_rent' || key === 'annual_rent' || key === 'deposit_amount' ? Number(values[key]) : key === 'escalation' ? { ...lease.escalation_clause, mechanism: values[key] } : key === 'renewal' ? values[key] : key === 'termination' ? values[key] : key === 'payment_frequency' ? values[key] : values[key]])))} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Save Corrections</button>
      <button disabled={busy} onClick={() => act(`/api/leases/${lease.lease_id}/accept`)} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Accept Lease</button>
      <button disabled={busy} onClick={() => act(`/api/leases/${lease.lease_id}/reject`)} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-50">Reject Lease</button>
    </div>}
    {(message || auditCount > 0) && <p role="status" className="mt-3 text-sm text-slate-600">{message}{auditCount > 0 && <span> · {auditCount} review action(s) recorded</span>}</p>}
  </section>;
}
