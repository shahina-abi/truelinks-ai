export type RuleStatus = 'PASS' | 'FAIL' | 'NOT_DETERMINABLE';
export type UnitStatus = 'available' | 'occupied';
export type ReviewAction = 'accept' | 'edit' | 'reject' | 'dismiss';
export type WorkOrderStatus = 'Draft' | 'Approved' | 'In Progress' | 'Completed' | 'Rejected';

export interface EvidenceItem {
  field: string;
  page?: number;
  text?: string;
  source?: string;
  confidence?: number;
}

export interface Unit {
  unit_id: string;
  label: string;
  type: string;
  area_sqm: number;
  parking_bay: string;
  status: UnitStatus;
}

export interface Party {
  name?: string;
  present?: boolean;
  signed?: boolean;
}

export interface LeaseExtraction {
  unit_id: string;
  landlord: Party;
  tenant: Party;
  commencement_date?: string;
  expiry_date?: string;
  term_months?: number;
  stated_term_months?: number;
  monthly_rent?: number;
  annual_rent?: number;
  currency?: string;
  payment_frequency?: string;
  deposit_amount?: number;
  security_deposit?: number;
  escalation_clause: {
    is_defined: boolean;
    mechanism?: string;
    percentage?: number;
    evidence?: EvidenceItem[];
  };
  renewal_terms?: string;
  termination_terms?: string;
  missing_fields: string[];
  contradictions: string[];
  review_flags: string[];
  evidence: EvidenceItem[];
  confidence: number;
  is_mock: boolean;
  source_note: string;
}

export interface LeaseRecord extends LeaseExtraction {
  lease_id: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  created_at: string;
}

export interface RuleEvaluation {
  ruleId: string;
  description: string;
  status: RuleStatus;
  explanation: string;
  severity: 'high' | 'medium' | 'low';
  sourceClause?: string;
  relevantValues: Record<string, unknown>;
  reviewRequired: boolean;
}

export interface PropertyIssue {
  issue_id: string;
  unit_id: string;
  title: string;
  description: string;
  observed_condition: string;
  detected_equipment: string[];
  uncertainty_notes: string[];
  image_references: string[];
  work_order: {
    title: string;
    repair_description: string;
    status: WorkOrderStatus;
  };
  status: 'Draft' | 'Approved' | 'Rejected';
  created_at: string;
}

export interface ReviewRecord {
  targetType: 'lease-field' | 'validation-rule' | 'issue' | 'work-order';
  targetId: string;
  originalValue?: string;
  reviewedValue?: string;
  action: ReviewAction;
  reviewer: string;
  createdAt: string;
  reason: string;
}

export interface WorkOrderRecord {
  work_order_id: string;
  issue_id?: string;
  unit_id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  created_at: string;
  is_mock: boolean;
}

export interface DemoDataStore {
  units: Unit[];
  leases: LeaseRecord[];
  issues: PropertyIssue[];
  workOrders: WorkOrderRecord[];
}
