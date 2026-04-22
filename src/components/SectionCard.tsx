import type { ReactNode } from 'react'

interface SectionCardProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  className?: string
}

export function SectionCard({
  eyebrow,
  title,
  description,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <section
      className={`rounded-[28px] border border-white/8 bg-slate-950/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur xl:p-7 ${className}`}
    >
      <div className="mb-6 flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/80">
          {eyebrow}
        </span>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-white">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
      </div>

      {children}
    </section>
  )
}
