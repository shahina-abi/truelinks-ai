import { NextResponse } from 'next/server';
import { acceptLease, getDemoDataStore, updateLease } from '@/services/demo-data-store';
import { evaluateLeaseAgainstRules } from '@/services/lease-validation';
import unitsData from '@/data/units.json';
import type { LeaseRecord } from '@/types/domain';

export async function PATCH(request: Request, { params }: { params: { leaseId: string } }) {
  try {
    const values = await request.json() as Partial<LeaseRecord>;
    const lease = updateLease(params.leaseId, values);
    if (!lease) return NextResponse.json({ ok: false, message: 'Lease not found.' }, { status: 404 });
    return NextResponse.json({ ok: true, lease, rules: evaluateLeaseAgainstRules(lease, unitsData) });
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid lease corrections.' }, { status: 400 });
  }
}

export async function POST(_request: Request, { params }: { params: { leaseId: string } }) {
  const current = getDemoDataStore().leases.find((lease) => lease.lease_id === params.leaseId);
  if (!current) return NextResponse.json({ ok: false, message: 'Lease not found.' }, { status: 404 });
  const rules = evaluateLeaseAgainstRules(current, unitsData);
  const result = acceptLease(params.leaseId);
  if (result.error) return NextResponse.json({ ok: false, message: result.error, rules }, { status: 409 });
  return NextResponse.json({ ok: true, lease: result.lease, rules });
}
