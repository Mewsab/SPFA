function StatCard({ label, labelColor = 'var(--spfa-info)', value, description }) {
  return (
    <article
      className="subtle-card overflow-hidden p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-[20px]"
      style={{
        borderColor: 'var(--spfa-border)',
        background: 'var(--spfa-surface)',
      }}
    >
      <div
        className="inline-flex rounded-md border px-3 py-2 text-sm font-semibold uppercase tracking-wide"
        style={{
          borderColor: `color-mix(in srgb, ${labelColor} 42%, transparent)`,
          background: `color-mix(in srgb, ${labelColor} 14%, transparent)`,
          color: labelColor,
        }}
      >
        {label}
      </div>
      <p className="mt-5 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  )
}

export default StatCard
