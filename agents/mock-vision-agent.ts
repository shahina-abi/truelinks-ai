import type { PropertyIssue } from '@/types/domain';

export async function analyzeImages(
  images: Array<{ name: string; type: string }>,
  unitContext: { unit_id: string },
): Promise<Omit<PropertyIssue, 'created_at'> & { observed_facts: string[]; inferences: string[] }> {
  if (!images.length) {
    throw new Error('At least one image is required before a property issue can be analyzed.');
  }

  const observedFacts = [
    'Visible wall staining is present near the AC return vent.',
    'A split AC unit is installed in the living room wall.',
    'The ceiling around the vent shows discoloration and minor surface flaking.',
  ];

  const inferences = [
    'The staining may be caused by condensation or a prior leak, but the exact source is not proven from a photo alone.',
    'The AC may still be operating, but operational status cannot be confirmed without an on-site inspection.',
  ];

  return {
    issue_id: `ISS-${Date.now()}`,
    unit_id: unitContext.unit_id,
    title: 'AC moisture staining and wall finish damage',
    description: 'Visible moisture staining and minor finish degradation around the AC vent suggest a possible leak or condensation issue requiring inspection.',
    observed_condition: 'Moisture staining around a wall-mounted AC unit with minor paint cracking.',
    detected_equipment: ['Wall-mounted split AC', 'Ceiling/Wall finish'],
    uncertainty_notes: inferences,
    image_references: images.map((image) => image.name),
    work_order: {
      title: 'Inspect AC condensation and repair wall finish',
      repair_description: 'Schedule a technician to inspect the AC drainage/condensation path, identify the root cause of staining, and repair any damaged wall finish or sealant.',
      status: 'Draft',
    },
    status: 'Draft',
    observed_facts: observedFacts,
    inferences,
  };
}
