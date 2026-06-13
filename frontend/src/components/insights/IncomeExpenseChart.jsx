import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const barColors = {
  Income: '#22c55e',
  Expenses: '#f43f5e',
}

function formatCurrency(value) {
  return `OMR ${Number(value || 0).toFixed(2)}`
}

function IncomeExpenseChart({ data = [], embedded = false }) {
  const chartData = data.map((item) => ({
    ...item,
    amount: Number(item.amount || 0),
  }))
  const hasData = chartData.some((item) => item.amount > 0)
  const Wrapper = embedded ? 'div' : 'section'

  return (
    <Wrapper className={embedded ? 'min-w-0' : 'soft-panel px-4 py-4 sm:px-5'}>
      <div>
        <h3 className="text-base font-semibold text-white">Income vs Expenses</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          A direct comparison of money coming in and going out.
        </p>
      </div>

      {!hasData ? (
        <div
          className="mt-5 rounded-lg border px-5 py-8 text-sm leading-7 text-slate-300"
          style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.03)' }}
        >
          Income and expense comparison will appear after activity is available.
        </div>
      ) : (
        <div className="mt-4 h-[236px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(148, 163, 184, 0.18)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  background: 'rgba(15, 17, 23, 0.96)',
                  border: '1px solid var(--spfa-border-accent)',
                  borderRadius: '8px',
                  color: '#cbd5e1',
                }}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={68}>
                {chartData.map((entry) => (
                  <Cell key={entry.label} fill={barColors[entry.label] || '#38bdf8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Wrapper>
  )
}

export default IncomeExpenseChart
