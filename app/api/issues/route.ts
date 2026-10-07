import { NextResponse } from 'next/server';
import { analyzeImages } from '@/agents/mock-vision-agent';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await analyzeImages(body.images ?? [], { unit_id: body.unit_id ?? 'MC-B-1204' });
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Unable to analyze property images.' }, { status: 400 });
  }
}
