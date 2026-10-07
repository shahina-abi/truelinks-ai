'use client';

import { useState } from 'react';
import type { PropertyIssue, WorkOrderRecord } from '@/types/domain';

export default function PropertyIssuesPanel({ unitId, initialIssues, initialWorkOrders }: { unitId: string; initialIssues: PropertyIssue[]; initialWorkOrders: WorkOrderRecord[] }) {
  const [issues, setIssues] = useState<PropertyIssue[]>(initialIssues);
  const [workOrders, setWorkOrders] = useState<WorkOrderRecord[]>(initialWorkOrders);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [demoImageRef, setDemoImageRef] = useState('demo-unit-1204-1.jpg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ title: '', description: '', recommended_action: '', priority: 'medium' as 'low' | 'medium' | 'high' });

  async function analyzePhoto() {
    setError('');
    setMessage('');

    const hasFile = imageFile && imageFile.type.startsWith('image/');
    const hasReference = demoImageRef.trim().length > 0;

    if (!hasFile && !hasReference) {
      setError('Please upload a photo or choose a demo image reference before analysis.');
      return;
    }

    if (imageFile && !imageFile.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      setError('Image is too large. Please upload an image under 5 MB.');
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          images: imageFile ? [{ name: imageFile.name, type: imageFile.type, size: imageFile.size }] : [{ name: demoImageRef, type: 'image/jpeg', size: 1500000 }],
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'Unable to analyze the uploaded photo.');

      setIssues((current) => [...current, result.issue]);
      if (result.workOrder) {
        setWorkOrders((current) => [...current, result.workOrder]);
      }
      setMessage('Property issue detected and draft work order created. Human review is required before approval.');
      setImageFile(null);
      setDemoImageRef('demo-unit-1204-1.jpg');
      const input = document.getElementById('photo-upload') as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to analyze the uploaded photo.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function approveWorkOrder(workOrderId: string) {
    try {
      const response = await fetch(`/api/workorders/${workOrderId}/approve`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'Unable to approve this work order.');
      setWorkOrders((current) => current.map((item) => item.work_order_id === workOrderId ? result.workOrder : item));
      setMessage('Work order approved and ready for execution.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to approve this work order.');
    }
  }

  async function rejectWorkOrder(workOrderId: string) {
    try {
      const response = await fetch(`/api/workorders/${workOrderId}/reject`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'Unable to reject this work order.');
      setWorkOrders((current) => current.map((item) => item.work_order_id === workOrderId ? result.workOrder : item));
      setMessage('Work order rejected and kept as a draft decision record.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to reject this work order.');
    }
  }

  async function saveWorkOrderEdit(workOrderId: string) {
    try {
      const response = await fetch(`/api/workorders/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editDraft.title,
          description: editDraft.description,
          priority: editDraft.priority,
          recommended_action: editDraft.recommended_action,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'Unable to update this work order.');
      setWorkOrders((current) => current.map((item) => item.work_order_id === workOrderId ? result.workOrder : item));
      setEditingId(null);
      setMessage('Work order updated for human review.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to update this work order.');
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">Property Issues</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">Mock vision</span>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <label className="block text-sm font-medium text-slate-700">Upload property photo</label>
        <input id="photo-upload" type="file" accept="image/*" className="mt-2 block w-full text-sm text-slate-600" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />

        <div className="mt-3 space-y-2">
          <label className="block text-sm font-medium text-slate-700">Or use demo image reference</label>
          <input value={demoImageRef} onChange={(event) => setDemoImageRef(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700" placeholder="demo-unit-1204-1.jpg" />
        </div>

        <button type="button" disabled={isAnalyzing} onClick={analyzePhoto} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {isAnalyzing ? 'Analyzing…' : 'Analyze Photo'}
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

      <div className="mt-6 space-y-4">
        {issues.length === 0 ? (
          <p className="text-sm text-slate-500">No property issues have been detected for this unit yet.</p>
        ) : issues.map((issue) => {
          const linkedWorkOrders = workOrders.filter((workOrder) => workOrder.issue_id === issue.issue_id);
          const workOrder = linkedWorkOrders[0];

          return (
            <div key={issue.issue_id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Issue</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{issue.title}</h3>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">{issue.status}</span>
              </div>

              <p className="mt-3 text-sm text-slate-700">{issue.description}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Severity</p><p className="mt-1 text-sm text-slate-700">{issue.severity}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Confidence</p><p className="mt-1 text-sm text-slate-700">{issue.confidence.toFixed(2)}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Location</p><p className="mt-1 text-sm text-slate-700">{issue.location ?? 'Not specified'}</p></div>
              </div>

              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Demo evidence</p>
                <p className="mt-1 text-sm text-slate-700">{issue.evidence}</p>
              </div>

              {workOrder && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Draft Work Order</p>
                  <h4 className="mt-1 text-base font-semibold text-slate-900">{workOrder.title}</h4>
                  <p className="mt-2 text-sm text-slate-700">{workOrder.recommended_action}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="rounded-full bg-slate-200 px-2.5 py-1">Priority: {workOrder.priority}</span>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1">Status: {workOrder.status}</span>
                  </div>

                  {editingId === workOrder.work_order_id ? (
                    <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                      <input value={editDraft.title} onChange={(event) => setEditDraft((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Work order title" />
                      <textarea value={editDraft.description} onChange={(event) => setEditDraft((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" rows={3} placeholder="Work order description" />
                      <textarea value={editDraft.recommended_action} onChange={(event) => setEditDraft((current) => ({ ...current, recommended_action: event.target.value }))} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" rows={2} placeholder="Recommended action" />
                      <select value={editDraft.priority} onChange={(event) => setEditDraft((current) => ({ ...current, priority: event.target.value as 'low' | 'medium' | 'high' }))} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => saveWorkOrderEdit(workOrder.work_order_id)} className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white">Save</button>
                        <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => approveWorkOrder(workOrder.work_order_id)} className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white">Approve Work Order</button>
                      <button type="button" onClick={() => {
                        setEditingId(workOrder.work_order_id);
                        setEditDraft({ title: workOrder.title, description: workOrder.description, recommended_action: workOrder.recommended_action, priority: workOrder.priority });
                      }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Edit Work Order</button>
                      <button type="button" onClick={() => rejectWorkOrder(workOrder.work_order_id)} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700">Reject Work Order</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
