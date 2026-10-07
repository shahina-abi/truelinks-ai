import { describe, expect, it } from 'vitest';
import { evaluateLeaseAgainstRules } from '../services/lease-validation';
import { lookupUnitById, matchLeaseToUnit } from '../services/unit-matching';
import { getLeaseByUnitId } from '../services/demo-data-store';
import unitsData from '../data/units.json';

const validLease = {
  unit_id: 'MC-B-1204',
  landlord: { name: 'Marina Crest Holdings W.L.L.', present: true, signed: true },
  tenant: { name: 'Aisha Rahman', present: true, signed: true },
  monthly_rent: 3500,
  annual_rent: 42000,
  deposit_amount: 3500,
  commencement_date: '2025-01-01',
  expiry_date: '2027-12-31',
  term_months: 36,
  escalation_clause: { is_defined: true, mechanism: '5% annual fixed escalation', percentage: 5 },
  currency: 'QAR',
  payment_frequency: 'monthly',
};

describe('lease validation rules', () => {
  it('accepts a compliant lease for an available unit', () => {
    const result = evaluateLeaseAgainstRules(validLease, unitsData);
    expect(result.filter((rule) => rule.status === 'FAIL')).toHaveLength(0);
    expect(result.find((rule) => rule.ruleId === 'R7')?.status).toBe('PASS');
  });

  it('returns NOT_DETERMINABLE for missing or invalid rent values in R1', () => {
    const resultA = evaluateLeaseAgainstRules({ ...validLease, deposit_amount: undefined, monthly_rent: undefined }, unitsData);
    const resultB = evaluateLeaseAgainstRules({ ...validLease, deposit_amount: 2000 }, unitsData);
    expect(resultA.find((entry) => entry.ruleId === 'R1')?.status).toBe('NOT_DETERMINABLE');
    expect(resultB.find((entry) => entry.ruleId === 'R1')?.status).toBe('FAIL');
  });

  it('fails R2 when escalation is vague or undefined', () => {
    const vague = evaluateLeaseAgainstRules({ ...validLease, escalation_clause: { is_defined: true, mechanism: 'as mutually agreed' } }, unitsData);
    const missing = evaluateLeaseAgainstRules({ ...validLease, escalation_clause: { is_defined: false } }, unitsData);
    expect(vague.find((entry) => entry.ruleId === 'R2')?.status).toBe('FAIL');
    expect(missing.find((entry) => entry.ruleId === 'R2')?.status).toBe('FAIL');
  });

  it('fails R3 when term is zero, invalid, or above the 36-month cap', () => {
    const zeroTerm = evaluateLeaseAgainstRules({ ...validLease, term_months: 0 }, unitsData);
    const highTerm = evaluateLeaseAgainstRules({ ...validLease, term_months: 48 }, unitsData);
    const missingTerm = evaluateLeaseAgainstRules({ ...validLease, term_months: undefined }, unitsData);
    expect(zeroTerm.find((entry) => entry.ruleId === 'R3')?.status).toBe('FAIL');
    expect(highTerm.find((entry) => entry.ruleId === 'R3')?.status).toBe('FAIL');
    expect(missingTerm.find((entry) => entry.ruleId === 'R3')?.status).toBe('NOT_DETERMINABLE');
  });

  it('fails R4 when dates are malformed, reversed, or do not reconcile with the term', () => {
    const malformed = evaluateLeaseAgainstRules({ ...validLease, commencement_date: 'not-a-date', expiry_date: '2027-12-31' }, unitsData);
    const reversed = evaluateLeaseAgainstRules({ ...validLease, commencement_date: '2027-02-01', expiry_date: '2025-01-01' }, unitsData);
    const mismatch = evaluateLeaseAgainstRules({ ...validLease, expiry_date: '2026-01-10', term_months: 36 }, unitsData);
    expect(malformed.find((entry) => entry.ruleId === 'R4')?.status).toBe('FAIL');
    expect(reversed.find((entry) => entry.ruleId === 'R4')?.status).toBe('FAIL');
    expect(mismatch.find((entry) => entry.ruleId === 'R4')?.status).toBe('FAIL');
  });

  it('returns NOT_DETERMINABLE for R5 when a party is missing and FAIL when a party is unsigned', () => {
    const missing = evaluateLeaseAgainstRules({ ...validLease, landlord: undefined, tenant: undefined }, unitsData);
    const unsigned = evaluateLeaseAgainstRules({ ...validLease, tenant: { ...validLease.tenant, signed: false } }, unitsData);
    expect(missing.find((entry) => entry.ruleId === 'R5')?.status).toBe('NOT_DETERMINABLE');
    expect(unsigned.find((entry) => entry.ruleId === 'R5')?.status).toBe('FAIL');
  });

  it('fails R6 when annual rent does not reconcile with monthly rent × 12 and handles missing values conservatively', () => {
    const mismatch = evaluateLeaseAgainstRules({ ...validLease, annual_rent: 40000 }, unitsData);
    const missing = evaluateLeaseAgainstRules({ ...validLease, monthly_rent: undefined }, unitsData);
    expect(mismatch.find((entry) => entry.ruleId === 'R6')?.status).toBe('FAIL');
    expect(missing.find((entry) => entry.ruleId === 'R6')?.status).toBe('NOT_DETERMINABLE');
  });

  it('allows R7 only for an exact available unit and fails occupied or unknown units', () => {
    const pass = evaluateLeaseAgainstRules({ ...validLease, unit_id: 'MC-B-1204' }, unitsData);
    const occupied = evaluateLeaseAgainstRules({ ...validLease, unit_id: 'MC-B-1205' }, unitsData);
    const missing = evaluateLeaseAgainstRules({ ...validLease, unit_id: 'MC-Z-9999' }, unitsData);
    expect(pass.find((entry) => entry.ruleId === 'R7')?.status).toBe('PASS');
    expect(occupied.find((entry) => entry.ruleId === 'R7')?.status).toBe('FAIL');
    expect(missing.find((entry) => entry.ruleId === 'R7')?.status).toBe('FAIL');
  });
});

describe('unit matching and occupancy guardrails', () => {
  it('matches the exact unit ID from the source records', () => {
    const unit = lookupUnitById('MC-A-0301', unitsData);
    expect(unit?.status).toBe('available');
  });

  it('prevents linking a lease to an occupied unit', () => {
    const outcome = matchLeaseToUnit({ ...validLease, unit_id: 'MC-B-1205' }, unitsData);
    expect(outcome.ok).toBe(false);
    expect(outcome.reason).toContain('occupied');
  });

  it('prevents linking when the unit is missing', () => {
    const outcome = matchLeaseToUnit({ ...validLease, unit_id: 'MC-Z-9999' }, unitsData);
    expect(outcome.ok).toBe(false);
    expect(outcome.reason).toContain('not found');
  });

  it('only returns a lease record for the exact matching unit ID and not for another unit', () => {
    const matchingLease = getLeaseByUnitId('MC-B-1204');
    const differentUnitLease = getLeaseByUnitId('MC-A-0301');

    expect(matchingLease?.unit_id).toBe('MC-B-1204');
    expect(differentUnitLease).toBeUndefined();
  });

  it('returns an undefined lease for an unknown unit ID', () => {
    expect(getLeaseByUnitId('MC-Z-9999')).toBeUndefined();
  });
});
