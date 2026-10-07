import { beforeEach, describe, expect, it } from 'vitest';
import {
  approveWorkOrder,
  createDraftWorkOrder,
  createIssueFromAnalysis,
  getDemoDataStore,
  getIssuesByUnitId,
  getWorkOrdersByUnitId,
  rejectWorkOrder,
  resetDemoDataStore,
  updateWorkOrder,
} from '../services/demo-data-store';

describe('property issue and work order workflow', () => {
  beforeEach(() => resetDemoDataStore());

  it('creates an issue and draft work order from mock photo analysis for the exact unit', () => {
    const issue = createIssueFromAnalysis({
      unit_id: 'MC-B-1204',
      issueType: 'water_damage',
      title: 'Possible water leak',
      description: 'Visible staining and moisture damage near ceiling.',
      location: 'Living room ceiling',
      severity: 'high',
      confidence: 0.88,
      recommendedAction: 'Inspect plumbing and affected ceiling area.',
      evidence: 'Demo vision evidence',
    });

    expect(issue.unit_id).toBe('MC-B-1204');
    expect(issue.issue_type).toBe('water_damage');
    expect(issue.severity).toBe('high');
    expect(issue.status).toBe('Draft');
    expect(getIssuesByUnitId('MC-B-1204').some((item) => item.issue_id === issue.issue_id)).toBe(true);

    const workOrder = getWorkOrdersByUnitId('MC-B-1204').find((item) => item.issue_id === issue.issue_id);
    expect(workOrder).toBeDefined();
    expect(workOrder?.status).toBe('Draft');
    expect(workOrder?.unit_id).toBe('MC-B-1204');
  });

  it('rejects issue creation when the unit does not exist', () => {
    expect(() => createIssueFromAnalysis({
      unit_id: 'MC-Z-9999',
      issueType: 'water_damage',
      title: 'Possible water leak',
      description: 'Visible staining.',
      location: 'Mock room',
      severity: 'high',
      confidence: 0.7,
      recommendedAction: 'Inspect the area.',
      evidence: 'Demo vision evidence',
    })).toThrow(/not found/i);
  });

  it('creates a draft work order for a detected issue', () => {
    const issue = createIssueFromAnalysis({
      unit_id: 'MC-B-1204',
      issueType: 'electrical',
      title: 'Lighting switch concern',
      description: 'The wall switch appears damaged.',
      location: 'Bedroom wall',
      severity: 'medium',
      confidence: 0.75,
      recommendedAction: 'Inspect the electrical fitting and replace if needed.',
      evidence: 'Demo vision evidence',
    });

    const workOrder = createDraftWorkOrder(issue.issue_id);
    expect(workOrder.issue_id).toBe(issue.issue_id);
    expect(workOrder.unit_id).toBe('MC-B-1204');
    expect(workOrder.status).toBe('Draft');
  });

  it('approves and rejects work orders without changing the linked unit', () => {
    const issue = createIssueFromAnalysis({
      unit_id: 'MC-B-1204',
      issueType: 'plumbing',
      title: 'Visible pipe leak',
      description: 'Pipe area shows moisture.',
      location: 'Kitchen wall',
      severity: 'high',
      confidence: 0.9,
      recommendedAction: 'Inspect and repair the pipe section.',
      evidence: 'Demo vision evidence',
    });

    const workOrder = createDraftWorkOrder(issue.issue_id);
    approveWorkOrder(workOrder.work_order_id);
    expect(getDemoDataStore().workOrders.find((item) => item.work_order_id === workOrder.work_order_id)?.status).toBe('Approved');

    const secondIssue = createIssueFromAnalysis({
      unit_id: 'MC-B-1204',
      issueType: 'paint',
      title: 'Wall finish damage',
      description: 'Paint and finish damage near hallway.',
      location: 'Hallway wall',
      severity: 'low',
      confidence: 0.7,
      recommendedAction: 'Repaint the damaged section.',
      evidence: 'Demo vision evidence',
    });

    const secondOrder = createDraftWorkOrder(secondIssue.issue_id);
    rejectWorkOrder(secondOrder.work_order_id);
    expect(getDemoDataStore().workOrders.find((item) => item.work_order_id === secondOrder.work_order_id)?.status).toBe('Rejected');
    expect(getDemoDataStore().units.find((unit) => unit.unit_id === 'MC-B-1204')?.status).toBe('available');
  });

  it('updates a draft work order and keeps it linked to the same issue and unit', () => {
    const issue = createIssueFromAnalysis({
      unit_id: 'MC-B-1204',
      issueType: 'hvac',
      title: 'Ventilation concern',
      description: 'Air vent appears blocked.',
      location: 'Bedroom vent',
      severity: 'medium',
      confidence: 0.8,
      recommendedAction: 'Clean and inspect the vent.',
      evidence: 'Demo vision evidence',
    });

    const workOrder = createDraftWorkOrder(issue.issue_id);
    const updated = updateWorkOrder(workOrder.work_order_id, {
      title: 'Updated vent cleaning',
      description: 'Clean and inspect bedroom vent assembly.',
      priority: 'high',
      recommended_action: 'Clean vent and check airflow performance.',
    });

    expect(updated?.title).toBe('Updated vent cleaning');
    expect(updated?.unit_id).toBe('MC-B-1204');
    expect(updated?.issue_id).toBe(issue.issue_id);
    expect(updated?.status).toBe('Draft');
  });
});
