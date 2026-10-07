import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ ok: true, data: { status: 'Draft', message: 'Work order drafted successfully for owner review.' } });
}
