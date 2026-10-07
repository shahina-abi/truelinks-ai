import Link from 'next/link';
import { evaluateLeaseAgainstRules } from '@/services/lease-validation';
import { getLeaseByUnitId, getUnitById } from '@/services/demo-data-store';
import unitsData from '@/data/units.json';
import LeaseReview from './lease-review';
import { getDemoDataStore } from '@/services/demo-data-store';

export default function UnitDetailsPage({ params }: { params: { unitId: string } }) {
  const unit = getUnitById(params.unitId);
  const leaseRecord = getLeaseByUnitId(params.unitId);

  if (!unit) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-red-600">Not found</p>
          <h1 className="mt-3 text-2xl font-bold text-red-700">Unit not found</h1>
          <p className="mt-2 text-sm text-red-700">No record exists for this unit ID in the application data.</p>
          <Link href="/" className="mt-4 inline-flex rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700">Back to portfolio</Link>
        </div>
      </main>
    );
  }

  if (!leaseRecord) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Unit detail</p>
          <h1 className="mt-3 text-3xl font-bold text-navy">{unit.unit_id}</h1>
          <p className="mt-2 text-slate-600">{unit.label} · {unit.type}</p>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <h2 className="text-xl font-semibold text-slate-800">No lease uploaded for this unit</h2>
            <p className="mt-2 text-sm text-slate-600">Only a matching lease record in the application data is shown. Upload a lease to create a record for this unit.</p>
            <button type="button" className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">Upload lease</button>
          </div>
        </div>
      </main>
    );
  }

  const rules = evaluateLeaseAgainstRules({ ...leaseRecord, unit_id: params.unitId }, unitsData);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Unit detail</p>
          <h1 className="text-3xl font-bold text-navy">{unit.unit_id}</h1>
          <p className="text-slate-600">{unit.label} · {unit.type}</p>
        </div>
        <Link href="/" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">Back to portfolio</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <LeaseReview lease={leaseRecord} auditCount={getDemoDataStore().leaseAudit.filter((record) => record.leaseId === leaseRecord.lease_id).length} />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-navy">Lease overview</h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">Mock lease record</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{leaseRecord.source_note}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Landlord</p><p className="mt-1">{leaseRecord.landlord.name}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tenant</p><p className="mt-1">{leaseRecord.tenant.name}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Commencement</p><p className="mt-1">{leaseRecord.commencement_date}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Expiry</p><p className="mt-1">{leaseRecord.expiry_date}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Monthly rent</p><p className="mt-1">{leaseRecord.currency} {leaseRecord.monthly_rent?.toLocaleString()}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Security deposit</p><p className="mt-1">{leaseRecord.currency} {leaseRecord.security_deposit?.toLocaleString()}</p></div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy">Validation results</h2>
            <div className="mt-4 space-y-3">
              {rules.map((rule) => (
                <div key={rule.ruleId} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">{rule.ruleId} · {rule.description}</p>
                      <p className="mt-1 text-xs text-slate-500">{rule.sourceClause}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${rule.status === 'PASS' ? 'bg-emerald-100 text-emerald-700' : rule.status === 'FAIL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {rule.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{rule.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy">Unit record</h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex justify-between"><dt>Property</dt><dd>Marina Crest Residences</dd></div>
              <div className="flex justify-between"><dt>Type</dt><dd>{unit.type}</dd></div>
              <div className="flex justify-between"><dt>Area</dt><dd>{unit.area_sqm} sqm</dd></div>
              <div className="flex justify-between"><dt>Parking</dt><dd>{unit.parking_bay}</dd></div>
              <div className="flex justify-between"><dt>Status</dt><dd className="font-medium text-slate-900">{unit.status}</dd></div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy">Mock AI warning</h2>
            <p className="mt-2 text-sm text-slate-700">This prototype uses deterministic demo output so the workflow works without an API key. Every extracted fact should be reviewed before approval.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
