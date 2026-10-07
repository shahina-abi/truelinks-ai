import { NextResponse } from 'next/server';
import { getUnits } from '@/services/demo-data-store';

export async function GET() {
  return NextResponse.json({ units: getUnits() });
}
