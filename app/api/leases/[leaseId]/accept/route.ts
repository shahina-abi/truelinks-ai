import { NextResponse } from 'next/server';
import { acceptLease, getDemoDataStore } from '@/services/demo-data-store';
import { evaluateLeaseAgainstRules } from '@/services/lease-validation';
import unitsData from '@/data/units.json';

export async function POST(_request: Request, { params }: { params: { leaseId: string } }) {
  const lease = getDemoDataStore().leases.find((item) => item.lease_id === params.leaseId);
  if (!lease) return NextResponse.json({ ok: false, message: 'Lease not found.' }, { status: 404 });
  const rules = evaluateLeaseAgainstRules(lease, unitsData);
  const result = acceptLease(params.leaseId);
  if (result.error) return NextResponse.json({ ok: false, message: result.error, rules }, { status: 409 });
  return NextResponse.json({ ok: true, lease: result.lease, rules });
}
