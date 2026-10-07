import Link from 'next/link';
import { flattenUnits } from '@/services/unit-matching';
import unitsData from '@/data/units.json';

const units = flattenUnits(unitsData as any);

export default function UnitsPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Portfolio</p>
          <h1 className="text-2xl font-bold text-navy">Units</h1>
        </div>
        <Link href="/" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Dashboard
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {units.map((unit) => (
          <Link key={unit.unit_id} href={`/units/${unit.unit_id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-semibold text-navy">{unit.unit_id}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${unit.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                {unit.status}
              </span>
            </div>
            <p className="text-sm text-slate-600">{unit.label}</p>
            <p className="mt-2 text-sm text-slate-500">Type: {unit.type}</p>
            <p className="text-sm text-slate-500">Area: {unit.area_sqm} sqm</p>
            <p className="text-sm text-slate-500">Parking: {unit.parking_bay}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
