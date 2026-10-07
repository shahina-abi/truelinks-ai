import { NextResponse } from 'next/server';
import { analyzeImages } from '@/agents/mock-vision-agent';
import { createIssueFromAnalysis, getIssuesByUnitId, getWorkOrdersByUnitId } from '@/services/demo-data-store';

function normalizeImages(payload: unknown): Array<{ name?: string; type?: string; size?: number }> {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as Array<{ name?: string; type?: string; size?: number }>;
  if (typeof payload === 'object') {
    const image = payload as { name?: string; type?: string; size?: number };
    return [{ name: image.name, type: image.type, size: image.size }];
  }
  return [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const unitId = body.unit_id ?? body.unitId ?? body.unit ?? '';
    const images = normalizeImages(body.images ?? body.image ?? []);

    if (!unitId) {
      return NextResponse.json({ ok: false, message: 'A unit ID is required before photo analysis can begin.' }, { status: 400 });
    }

    if (!images.length) {
      return NextResponse.json({ ok: false, message: 'At least one image is required before a property issue can be analyzed.' }, { status: 400 });
    }

    for (const image of images) {
      if (image.type && !image.type.startsWith('image/')) {
        return NextResponse.json({ ok: false, message: 'Only image files are accepted for property photo analysis.' }, { status: 400 });
      }
      if (typeof image.size === 'number' && image.size > 5 * 1024 * 1024) {
        return NextResponse.json({ ok: false, message: 'Image is too large. Please upload an image under 5 MB.' }, { status: 400 });
      }
    }

    const analysis = await analyzeImages(images, { unit_id: unitId });
    const issue = createIssueFromAnalysis({
      unit_id: unitId,
      issueType: analysis.issueType,
      title: analysis.title,
      description: analysis.description,
      location: analysis.location,
      severity: analysis.severity,
      confidence: analysis.confidence,
      recommendedAction: analysis.recommendedAction,
      evidence: analysis.evidence,
      imageReferences: analysis.imageReferences,
    });

    const workOrder = getWorkOrdersByUnitId(unitId).find((entry) => entry.issue_id === issue.issue_id);
    return NextResponse.json({ ok: true, issue, workOrder, issues: getIssuesByUnitId(unitId) });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Unable to analyze property images.' }, { status: 400 });
  }
}
