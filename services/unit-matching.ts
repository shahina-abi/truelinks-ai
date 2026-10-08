
import unitsData from '@/data/units.json';
import type { Unit, UnitStatus } from '@/types/domain';

export type UnitSourceData = typeof unitsData;

export function flattenUnits(data: UnitSourceData = unitsData): Unit[] {
  return (data.properties ?? []).flatMap((property) =>
    (property.buildings ?? []).flatMap((building) =>
      (building.units ?? []).map((unit) => ({
        unit_id: unit.unit_id,
        label: unit.label,
        type: unit.type,
        area_sqm: unit.area_sqm,
        parking_bay: unit.parking_bay,
        status: unit.status as UnitStatus,
      })),
    ),
  );
}

export function lookupUnitById(unitId: string, data: UnitSourceData = unitsData): Unit | undefined {
  return flattenUnits(data).find((unit) => unit.unit_id === unitId);
}

export function matchLeaseToUnit(
  lease: { unit_id?: string },
  data: UnitSourceData = unitsData,
): { ok: boolean; unit?: Unit; reason: string } {
  const unitId = lease.unit_id;
  if (!unitId) {
    return { ok: false, reason: 'Lease is missing a unit_id and cannot be matched to a property unit.' };
  }

  const unit = lookupUnitById(unitId, data);
  if (!unit) {
    return { ok: false, reason: `Unit ${unitId} was not found in the approved owner records.` };
  }

  if (unit.status !== 'available') {
    return { ok: false, reason: `Unit ${unitId} is currently occupied and cannot accept a new lease without owner approval.` };
  }

  return { ok: true, unit, reason: `Unit ${unitId} matches the owner records and is available.` };
}
