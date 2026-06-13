import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const chartColors = [
  '#38bdf8',
  '#67e8f9',
  '#22c55e',
  '#f59e0b',
  '#f43f5e',
  '#0ea5e9',
  '#67e8f9',
  '#fb7185',
  '#14b8a6',
]

function formatCurrency(value) {
  return `OMR ${Number(value || 0).toFixed(2)}`
}

function SpendingBreakdownChart({ data = [], embedded = false }) {
  const chartData = data.map((item) => ({
    ...item,
    amount: Number(item.amount || 0),
    percentage: Number(item.percentage || 0),
  }))
  const Wrapper = embedded ? 'div' : 'section'

  return (
    <Wrapper className={embedded ? 'min-w-0' : 'soft-panel px-4 py-4 sm:px-5'}>
      <div>
        <h3 className="text-base font-semibold text-white">Spending Breakdown</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Expense categories ranked by current spending.
        </p>
      </div>

      {chartData.length === 0 ? (
        <div
          className="mt-5 rounded-lg border px-5 py-8 text-sm leading-7 text-slate-300"
          style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.03)' }}
        >
          Spending breakdown will appear after transactions are added or a CSV is imported.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px] 2xl:grid-cols-1">
          <div className="h-[236px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="label"
                  innerRadius="54%"
                  outerRadius="78%"
                  paddingAngle={3}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={entry.category} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    background: 'rgba(15, 17, 23, 0.96)',
                    border: '1px solid var(--spfa-border-accent)',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5">
            {chartData.slice(0, 8).map((item, index) => (
              <div key={item.category} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: chartColors[index % chartColors.length] }}
                  />
                  <span className="truncate text-slate-300">{item.label}</span>
                </div>
                <span className="shrink-0 font-medium text-white">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Wrapper>
  )
}

export default SpendingBreakdownChart
