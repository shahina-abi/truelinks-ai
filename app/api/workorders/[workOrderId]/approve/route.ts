import { NextResponse } from 'next/server';
import { approveWorkOrder, getWorkOrderById } from '@/services/demo-data-store';

export async function POST(_request: Request, { params }: { params: { workOrderId: string } }) {
  const existing = getWorkOrderById(params.workOrderId);
  if (!existing) {
    return NextResponse.json({ ok: false, message: 'Work order not found.' }, { status: 404 });
  }

  const workOrder = approveWorkOrder(params.workOrderId);
  if (!workOrder) {
    return NextResponse.json({ ok: false, message: 'Unable to approve this work order.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, workOrder });
}
