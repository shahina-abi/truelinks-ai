import { beforeEach, describe, expect, it } from 'vitest';
import { acceptLease, getDemoDataStore, getLeaseByUnitId, rejectLease, resetDemoDataStore, updateLease } from '../services/demo-data-store';
import { evaluateLeaseAgainstRules } from '../services/lease-validation';

describe('human lease review workflow', () => {
  beforeEach(() => resetDemoDataStore());

  it('starts pending review without occupying the unit', () => {
    expect(getLeaseByUnitId('MC-B-1204')?.review_status).toBe('PENDING_REVIEW');
    expect(getDemoDataStore().units.find((unit) => unit.unit_id === 'MC-B-1204')?.status).toBe('available');
  });

  it('saves corrections, records changed values, and revalidates the corrected lease', () => {
    const lease = getLeaseByUnitId('MC-B-1204')!;
    updateLease(lease.lease_id, { monthly_rent: 4000, annual_rent: 48000 });
    expect(lease.monthly_rent).toBe(4000);
    expect(getDemoDataStore().leaseAudit[0]).toMatchObject({ action: 'SAVE_CORRECTIONS', leaseId: lease.lease_id });
    expect(getDemoDataStore().leaseAudit[0].changes.monthly_rent).toEqual({ before: 3500, after: 4000 });
    expect(evaluateLeaseAgainstRules(lease).find((rule) => rule.ruleId === 'R6')?.status).toBe('PASS');
  });

  it('accepts a lease, occupies its exact unit, and creates an audit record', () => {
    const result = acceptLease('LEASE-MC-B-1204');
    expect(result.lease?.review_status).toBe('ACCEPTED');
    expect(getDemoDataStore().units.find((unit) => unit.unit_id === 'MC-B-1204')?.status).toBe('occupied');
    expect(getDemoDataStore().leaseAudit.at(-1)).toMatchObject({ action: 'ACCEPT', leaseId: 'LEASE-MC-B-1204' });
  });

  it('rejects a lease while keeping its unit available and audits the action', () => {
    const lease = rejectLease('LEASE-MC-B-1204');
    expect(lease?.review_status).toBe('REJECTED');
    expect(getDemoDataStore().units.find((unit) => unit.unit_id === 'MC-B-1204')?.status).toBe('available');
    expect(getDemoDataStore().leaseAudit.at(-1)?.action).toBe('REJECT');
  });

  it('prevents accepting a lease for an occupied unit', () => {
    getDemoDataStore().units.find((unit) => unit.unit_id === 'MC-B-1204')!.status = 'occupied';
    expect(acceptLease('LEASE-MC-B-1204').error).toContain('already occupied');
  });

  it('prevents accepting a lease when its exact unit ID is unknown', () => {
    getLeaseByUnitId('MC-B-1204')!.unit_id = 'MC-Z-9999';
    expect(acceptLease('LEASE-MC-B-1204').error).toContain('not found');
    expect(getDemoDataStore().units.find((unit) => unit.unit_id === 'MC-B-1204')?.status).toBe('available');
  });

  it('keeps lease lookup isolated to the exact unit ID', () => {
    expect(getLeaseByUnitId('MC-A-0301')).toBeUndefined();
    expect(getLeaseByUnitId('MC-B-1204')?.unit_id).toBe('MC-B-1204');
  });

  it('includes illustrative demo evidence for every field displayed in the review form', () => {
    const lease = getLeaseByUnitId('MC-B-1204')!;
    const requiredEvidenceFields = [
      'landlord', 'tenant', 'unit_id', 'commencement_date', 'expiry_date', 'term_months',
      'monthly_rent', 'annual_rent', 'deposit_amount', 'payment_frequency', 'escalation_clause',
      'renewal', 'termination',
    ];

    requiredEvidenceFields.forEach((field) => {
      expect(lease.evidence.some((item) => item.field === field && !!item.text && /Illustrative demo evidence|Demo evidence/i.test(item.text))).toBe(true);
    });
  });
});
