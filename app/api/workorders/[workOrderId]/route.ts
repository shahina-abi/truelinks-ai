import { NextResponse } from 'next/server';
import { getWorkOrderById, updateWorkOrder } from '@/services/demo-data-store';

export async function GET(_request: Request, { params }: { params: { workOrderId: string } }) {
  const workOrder = getWorkOrderById(params.workOrderId);
  if (!workOrder) {
    return NextResponse.json({ ok: false, message: 'Work order not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, workOrder });
}

export async function PATCH(request: Request, { params }: { params: { workOrderId: string } }) {
  try {
    const values = await request.json();
    const workOrder = updateWorkOrder(params.workOrderId, values);
    if (!workOrder) {
      return NextResponse.json({ ok: false, message: 'Work order not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, workOrder });
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid work order update.' }, { status: 400 });
  }
}
