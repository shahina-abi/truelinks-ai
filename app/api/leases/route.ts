import { NextResponse } from 'next/server';
import { extractLease } from '@/agents/mock-lease-agent';
import { getLeaseByUnitId } from '@/services/demo-data-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const unitId = typeof body.unit_id === 'string' && body.unit_id.trim().length > 0 ? body.unit_id.trim() : undefined;
    const text = typeof body.text === 'string' ? body.text : typeof body.document === 'string' ? body.document : '';

    const result = await extractLease({ text, unit_id: unitId ?? undefined });
    const storedLease = unitId ? getLeaseByUnitId(unitId) : undefined;

    return NextResponse.json({
      ok: true,
      data: result,
      unit_id: unitId ?? result.unit_id,
      has_record: Boolean(storedLease),
      lease_record: storedLease ?? null,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Unable to extract lease data.' }, { status: 400 });
  }
}
