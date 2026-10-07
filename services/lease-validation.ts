import ownerRuleset from '@/data/owner_ruleset.json';
import unitsData from '@/data/units.json';
import { matchLeaseToUnit } from '@/services/unit-matching';
import type { LeaseExtraction, RuleEvaluation, RuleStatus } from '@/types/domain';

const ruleData = ownerRuleset as { rules: Array<{ id: string; description: string; severity: 'high' | 'medium' | 'low' }> };

type LeaseLike = Partial<LeaseExtraction> & {
  unit_id?: string;
  deposit_amount?: number;
};

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const normalized = Number(trimmed.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(normalized) ? normalized : undefined;
  }

  return undefined;
}

function isDateString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function dateToIso(value: string): Date | undefined {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

// Convention: count calendar months by the month difference between the two dates, and count the end month when the day-of-month is the same or later.
// Example: 2025-01-01 to 2027-12-31 resolves to 36 months.
function monthsBetween(start: string | undefined, end: string | undefined): number | undefined {
  if (!start || !end) return undefined;
  const startDate = dateToIso(start);
  const endDate = dateToIso(end);
  if (!startDate || !endDate) return undefined;
  if (endDate <= startDate) return undefined;

  const monthCount = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
  return endDate.getDate() >= startDate.getDate() ? monthCount + 1 : monthCount;
}

export function evaluateLeaseAgainstRules(lease: LeaseLike, data: typeof unitsData = unitsData): RuleEvaluation[] {
  const rules = ruleData.rules.map((rule) => {
    const unitMatch = matchLeaseToUnit(lease, data);
    const relevantValues: Record<string, unknown> = {
      deposit_amount: lease.deposit_amount ?? lease.security_deposit,
      monthly_rent: lease.monthly_rent,
      annual_rent: lease.annual_rent,
      commencement_date: lease.commencement_date,
      expiry_date: lease.expiry_date,
      term_months: lease.term_months,
      unit_id: lease.unit_id,
      escalation_clause: lease.escalation_clause,
    };

    switch (rule.id) {
      case 'R1': {
        const monthlyRent = parseNumber(lease.monthly_rent);
        const securityDeposit = parseNumber(lease.deposit_amount ?? lease.security_deposit);

        if (monthlyRent === undefined || securityDeposit === undefined) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'NOT_DETERMINABLE',
            explanation: 'The monthly rent or security deposit is missing or invalid, so the deposit threshold cannot be confirmed.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        if (monthlyRent <= 0 || securityDeposit < 0) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'NOT_DETERMINABLE',
            explanation: 'The rent or deposit values are invalid, so the deposit comparison cannot be relied on.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        const status: RuleStatus = securityDeposit >= monthlyRent ? 'PASS' : 'FAIL';
        return {
          ruleId: rule.id,
          description: rule.description,
          status,
          explanation: status === 'PASS'
            ? 'The security deposit meets or exceeds one month of rent.'
            : 'The security deposit is below one month of rent and fails the owner rule.',
          severity: rule.severity,
          sourceClause: `Owner rule: ${rule.id}`,
          relevantValues,
          reviewRequired: status !== 'PASS',
        };
      }

      case 'R2': {
        const clause = (lease.escalation_clause ?? { is_defined: false, mechanism: '', percentage: undefined }) as {
          is_defined?: boolean;
          mechanism?: string;
          percentage?: number;
        };
        const mechanism = typeof clause.mechanism === 'string' ? clause.mechanism.trim().toLowerCase() : '';
        const percentage = typeof clause.percentage === 'number' && Number.isFinite(clause.percentage) ? clause.percentage : undefined;
        const vaguePatterns = ['as mutually agreed', 'mutually agreed', 'as agreed', 'to be agreed', 'subject to agreement', 'negotiable'];
        const isVague = mechanism.length > 0 && vaguePatterns.some((pattern) => mechanism.includes(pattern));
        const hasExplicitMechanism = mechanism.length > 0 && /percent|percentage|increase|escalat/i.test(mechanism);
        const isDefined = clause.is_defined === true;

        if (clause.is_defined === false) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'FAIL',
            explanation: 'The lease does not define a rent escalation mechanism or percentage.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        if (!isDefined && mechanism.length === 0 && percentage === undefined) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'NOT_DETERMINABLE',
            explanation: 'The escalation clause is missing, so the rule cannot be checked.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        if (isVague || (!hasExplicitMechanism && percentage === undefined)) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'FAIL',
            explanation: 'The lease mentions an escalation only in vague terms or does not provide a defined percentage or mechanism.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        return {
          ruleId: rule.id,
          description: rule.description,
          status: 'PASS',
          explanation: 'The lease includes a defined escalation mechanism or percentage and can be reviewed against the owner rule.',
          severity: rule.severity,
          sourceClause: `Owner rule: ${rule.id}`,
          relevantValues,
          reviewRequired: false,
        };
      }

      case 'R3': {
        const termMonths = typeof lease.term_months === 'number' ? lease.term_months : undefined;

        if (termMonths === undefined) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'NOT_DETERMINABLE',
            explanation: 'The term length is missing, so the 36-month cap cannot be checked.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        if (!Number.isFinite(termMonths) || termMonths <= 0) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'FAIL',
            explanation: 'The lease term is not a valid positive number and therefore fails the fixed-term validation.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        const status: RuleStatus = termMonths <= 36 ? 'PASS' : 'FAIL';
        return {
          ruleId: rule.id,
          description: rule.description,
          status,
          explanation: status === 'PASS'
            ? 'The fixed term is within the allowed 36-month limit.'
            : 'The fixed term exceeds the 36-month limit without the required owner approval.',
          severity: rule.severity,
          sourceClause: `Owner rule: ${rule.id}`,
          relevantValues,
          reviewRequired: status !== 'PASS',
        };
      }

      case 'R4': {
        const start = typeof lease.commencement_date === 'string' ? lease.commencement_date.trim() : undefined;
        const end = typeof lease.expiry_date === 'string' ? lease.expiry_date.trim() : undefined;
        const termMonths = typeof lease.term_months === 'number' ? lease.term_months : undefined;

        if (!start || !end) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'NOT_DETERMINABLE',
            explanation: 'The commencement or expiry date is missing, so the term date reconciliation cannot be checked.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        if (!isDateString(start) || !isDateString(end)) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'FAIL',
            explanation: 'The lease contains invalid date values and cannot be reconciled.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        const startDate = dateToIso(start);
        const endDate = dateToIso(end);
        if (!startDate || !endDate) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'FAIL',
            explanation: 'The lease contains dates that cannot be parsed reliably.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        if (endDate <= startDate) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'FAIL',
            explanation: 'The expiry date must be after the commencement date.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        if (termMonths === undefined) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'NOT_DETERMINABLE',
            explanation: 'The lease does not include a term-month value for the date reconciliation check.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        if (!Number.isFinite(termMonths) || termMonths <= 0) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'FAIL',
            explanation: 'The stated term value is not a valid positive number and fails date reconciliation.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        const monthCount = monthsBetween(start, end);
        const status: RuleStatus = monthCount === termMonths ? 'PASS' : 'FAIL';
        return {
          ruleId: rule.id,
          description: rule.description,
          status,
          explanation: status === 'PASS'
            ? 'The expiry date is later than the commencement date and the stated term matches the calendar-month count.'
            : `The term length does not match the month count between the commencement and expiry dates (${monthCount ?? 'unknown'} vs. ${termMonths}).`,
          severity: rule.severity,
          sourceClause: `Owner rule: ${rule.id}`,
          relevantValues: { ...relevantValues, monthsBetween: monthCount },
          reviewRequired: status !== 'PASS',
        };
      }

      case 'R5': {
        const landlord = lease.landlord;
        const tenant = lease.tenant;

        if (!landlord || !tenant) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'NOT_DETERMINABLE',
            explanation: 'The document does not provide enough information to confirm both parties are identified.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        const landlordNamePresent = typeof landlord.name === 'string' && landlord.name.trim().length > 0;
        const tenantNamePresent = typeof tenant.name === 'string' && tenant.name.trim().length > 0;
        const landlordSigned = landlord.signed === true;
        const tenantSigned = tenant.signed === true;

        if (landlord.present === false || tenant.present === false) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'FAIL',
            explanation: 'At least one party is marked as absent, so the lease cannot satisfy the two-party signature requirement.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        if (!landlordNamePresent || !tenantNamePresent) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'NOT_DETERMINABLE',
            explanation: 'The lease identifies a party but does not provide enough evidence to confirm the full name and signature status.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        const status: RuleStatus = landlordSigned && tenantSigned ? 'PASS' : landlordSigned === undefined || tenantSigned === undefined ? 'NOT_DETERMINABLE' : 'FAIL';
        return {
          ruleId: rule.id,
          description: rule.description,
          status,
          explanation: status === 'PASS'
            ? 'Both landlord and tenant are identified and each has a signature on the lease.'
            : status === 'FAIL'
              ? 'At least one party is missing a signature or is otherwise not valid for acceptance.'
              : 'The document does not provide enough evidence to confirm the signature status for one or both parties.',
          severity: rule.severity,
          sourceClause: `Owner rule: ${rule.id}`,
          relevantValues,
          reviewRequired: status !== 'PASS',
        };
      }

      case 'R6': {
        const monthlyRent = parseNumber(lease.monthly_rent);
        const annualRent = parseNumber(lease.annual_rent);

        if (monthlyRent === undefined || annualRent === undefined) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'NOT_DETERMINABLE',
            explanation: 'The annual or monthly rent value is missing, so the rent reconciliation check cannot be performed.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        if (monthlyRent <= 0 || annualRent <= 0) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'NOT_DETERMINABLE',
            explanation: 'The rent values are invalid or non-positive, so the annual-to-monthly reconciliation cannot be trusted.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        const status: RuleStatus = annualRent === monthlyRent * 12 ? 'PASS' : 'FAIL';
        return {
          ruleId: rule.id,
          description: rule.description,
          status,
          explanation: status === 'PASS'
            ? 'Annual rent matches the stated monthly rent multiplied by 12.'
            : `Annual rent does not reconcile with monthly rent × 12 (${annualRent} vs. ${monthlyRent * 12}).`,
          severity: rule.severity,
          sourceClause: `Owner rule: ${rule.id}`,
          relevantValues,
          reviewRequired: status !== 'PASS',
        };
      }

      case 'R7': {
        const unitId = typeof lease.unit_id === 'string' && lease.unit_id.trim().length > 0 ? lease.unit_id.trim() : undefined;
        if (!unitId) {
          return {
            ruleId: rule.id,
            description: rule.description,
            status: 'NOT_DETERMINABLE',
            explanation: 'No unit ID was supplied for the linkage check.',
            severity: rule.severity,
            sourceClause: `Owner rule: ${rule.id}`,
            relevantValues,
            reviewRequired: true,
          };
        }

        const unitMatch = matchLeaseToUnit({ unit_id: unitId }, data);
        const status: RuleStatus = unitMatch.ok ? 'PASS' : 'FAIL';
        return {
          ruleId: rule.id,
          description: rule.description,
          status,
          explanation: status === 'PASS'
            ? `Unit ${unitId} exists in the owner records and is currently available for linking.`
            : unitMatch.reason,
          severity: rule.severity,
          sourceClause: `Owner rule: ${rule.id}`,
          relevantValues: { ...relevantValues, unit_status: unitMatch.unit?.status },
          reviewRequired: status !== 'PASS',
        };
      }

      default: {
        const status: RuleStatus = 'NOT_DETERMINABLE';
        return {
          ruleId: rule.id,
          description: rule.description,
          status,
          explanation: 'No rule implementation was found for this evaluation.',
          severity: rule.severity,
          sourceClause: `Owner rule: ${rule.id}`,
          relevantValues,
          reviewRequired: true,
        };
      }
    }
  });

  return rules as RuleEvaluation[];
}

export function buildRuleResult(ruleId: string, status: RuleStatus, explanation: string, relevantValues: Record<string, unknown>, severity: 'high' | 'medium' | 'low' = 'medium') {
  const rule = ruleData.rules.find((item) => item.id === ruleId);
  return {
    ruleId,
    description: rule?.description ?? '',
    status,
    explanation,
    severity,
    sourceClause: `Owner rule: ${ruleId}`,
    relevantValues,
    reviewRequired: status !== 'PASS',
  };
}
