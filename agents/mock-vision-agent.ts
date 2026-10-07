export async function analyzeImages(
  images: Array<{ name?: string; type?: string; size?: number }>,
  unitContext: { unit_id: string },
): Promise<{
  issueType: string;
  title: string;
  description: string;
  location: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  recommendedAction: string;
  evidence: string;
  imageReferences: string[];
}> {
  if (!images.length) {
    throw new Error('At least one image is required before a property issue can be analyzed.');
  }

  const fileNames = images.map((image) => image.name || 'demo-image-reference.jpg');
  const issueType = 'water_damage';
  const title = 'Possible water leak';
  const description = 'Visible staining and moisture damage near the ceiling suggest a possible leak or condensation issue requiring inspection.';
  const location = 'Living room ceiling';
  const severity = 'high';
  const confidence = 0.88;

  return {
    issueType,
    title,
    description,
    location,
    severity,
    confidence,
    recommendedAction: 'Inspect plumbing and the affected ceiling area before scheduling repairs.',
    evidence: `Demo vision evidence for ${fileNames[0]}: illustrative only, not a confirmed field inspection.`,
    imageReferences: fileNames,
  };
}
