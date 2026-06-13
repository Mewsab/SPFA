function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="auth-spotlight soft-panel relative overflow-hidden px-6 py-10 sm:px-10 lg:px-12">
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border px-4 py-1 text-sm font-medium text-cyan-100" style={{ borderColor: 'var(--spfa-border-accent)', background: 'var(--spfa-accent)' }}>
                Smart Personal Finance Assistant
              </span>
              <div className="space-y-3">
                <h1 className="max-w-xl text-4xl font-semibold tracking-normal text-white sm:text-5xl">
                  Your personal finance workspace, ready when you are.
                </h1>
                <p className="max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
                  Secure tracking, budgeting, and AI-ready insights in one focused dashboard.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4" style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.04)' }}>
                <p className="text-sm font-medium text-cyan-100">Secure tracking</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Keep your financial records organized in a clean, reliable workspace.
                </p>
              </div>
              <div className="rounded-lg border p-4" style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.04)' }}>
                <p className="text-sm font-medium text-cyan-100">AI-ready insights</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Start with budgeting now and grow into smarter guidance as your data builds up.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="soft-panel flex items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2">
              <h2 className="section-title">{title}</h2>
              <p className="section-copy text-sm leading-6">{subtitle}</p>
            </div>
            {children}
            {footer}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AuthLayout
