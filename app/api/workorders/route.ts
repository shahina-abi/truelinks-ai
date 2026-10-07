import { NextResponse } from 'next/server';
import { createDraftWorkOrder, getWorkOrdersByUnitId } from '@/services/demo-data-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get('unitId');
  const workOrders = unitId ? getWorkOrdersByUnitId(unitId) : [];
  return NextResponse.json({ ok: true, workOrders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const issueId = body.issueId ?? body.issue_id;
    if (!issueId) {
      return NextResponse.json({ ok: false, message: 'An issue ID is required to generate a draft work order.' }, { status: 400 });
    }

    const workOrder = createDraftWorkOrder(issueId);
    return NextResponse.json({ ok: true, workOrder });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Unable to create a draft work order.' }, { status: 400 });
  }
}
