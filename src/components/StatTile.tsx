import type { ReactNode } from 'react'

interface StatTileProps {
  label: string
  value: ReactNode
  helper?: string
  accent?: 'emerald' | 'cyan' | 'amber' | 'rose'
}

const accentClasses: Record<NonNullable<StatTileProps['accent']>, string> = {
  emerald: 'from-emerald-400/15 to-emerald-300/5 text-emerald-100',
  cyan: 'from-cyan-400/15 to-cyan-300/5 text-cyan-100',
  amber: 'from-amber-400/15 to-amber-300/5 text-amber-100',
  rose: 'from-rose-400/15 to-rose-300/5 text-rose-100',
}

export function StatTile({
  label,
  value,
  helper,
  accent = 'emerald',
}: StatTileProps) {
  return (
    <div
      className={`rounded-2xl border border-white/8 bg-gradient-to-br ${accentClasses[accent]} p-4`}
    >
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-300">{helper}</p> : null}
    </div>
  )
}
