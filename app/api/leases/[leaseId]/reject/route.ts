import { NextResponse } from 'next/server';
import { rejectLease } from '@/services/demo-data-store';

export async function POST(_request: Request, { params }: { params: { leaseId: string } }) {
  const lease = rejectLease(params.leaseId);
  return lease
    ? NextResponse.json({ ok: true, lease })
    : NextResponse.json({ ok: false, message: 'Lease not found.' }, { status: 404 });
}
