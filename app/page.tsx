import { Building2, FileCheck2, AlertTriangle, ClipboardCheck, Wrench, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getUnits } from '@/services/demo-data-store';

const units = getUnits();

export default function HomePage() {
  const available = units.filter((unit) => unit.status === 'available').length;
  const occupied = units.filter((unit) => unit.status === 'occupied').length;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-6">
        <aside className="mb-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Portfolio</p>
            <h1 className="mt-2 text-2xl font-bold text-navy">TrueLinks AI</h1>
          </div>
          <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Demo mode: mock AI results clearly labelled
          </div>
        </aside>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Available units', value: String(available), icon: Building2, accent: 'blue' },
            { label: 'Occupied units', value: String(occupied), icon: ClipboardCheck, accent: 'green' },
            { label: 'Lease checks to review', value: '3', icon: FileCheck2, accent: 'amber' },
            { label: 'Draft work orders', value: '1', icon: Wrench, accent: 'red' },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-slate-100 p-2">
                  <card.icon className="h-5 w-5 text-navy" />
                </div>
                <span className="text-2xl font-semibold text-slate-900">{card.value}</span>
              </div>
              <p className="mt-4 text-sm text-slate-600">{card.label}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-navy">Units</h2>
              <Link href="/units" className="inline-flex items-center gap-2 text-sm font-medium text-brand">
                View all units <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {units.map((unit) => (
                <Link key={unit.unit_id} href={`/units/${unit.unit_id}`} className="block rounded-xl border border-slate-200 p-4 transition hover:border-brand hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-navy">{unit.unit_id}</p>
                      <p className="text-sm text-slate-500">{unit.label} · {unit.type}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${unit.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {unit.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold text-navy">Priority review queue</h2>
            </div>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="rounded-lg bg-amber-50 p-3">MC-B-1204: Lease rule R2 needs owner review.</li>
              <li className="rounded-lg bg-amber-50 p-3">MC-B-1204: Escalation clause is defined but needs validation.</li>
              <li className="rounded-lg bg-rose-50 p-3">MC-A-0301: Draft work order awaiting approval.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
