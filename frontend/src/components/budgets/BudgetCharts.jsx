import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const amountFormatter = new Intl.NumberFormat('en-OM', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatCurrency(amount) {
  return `OMR ${amountFormatter.format(Number(amount || 0))}`
}

function ProjectionBar({ data }) {
  return (
    <Bar dataKey="projected_spending" name="Projected" radius={[8, 8, 0, 0]}>
      {data.map((item) => (
        <Cell
          key={item.category}
          fill={Number(item.projected_spending || 0) > Number(item.limit_amount || 0) ? '#f43f5e' : '#f59e0b'}
        />
      ))}
    </Bar>
  )
}

function BudgetCharts({ chartData = [] }) {
  const hasChartData = chartData.length > 0

  if (!hasChartData) {
    return (
      <section className="soft-panel p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-white">Budget Charts</h3>
        <p className="mt-5 rounded-xl border px-5 py-8 text-center text-sm text-slate-400" style={{ borderColor: 'rgba(103, 232, 249, 0.14)', background: 'rgba(255, 255, 255, 0.02)' }}>
          Charts will appear once you create budgets and add transactions.
        </p>
      </section>
    )
  }

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="soft-panel p-5 sm:p-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Budget Usage by Category</h3>
          <p className="mt-1 text-sm text-slate-400">Spent and remaining amounts across active budgets.</p>
        </div>

        <div className="mt-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(103, 232, 249, 0.06)' }}
                contentStyle={{
                  border: '1px solid rgba(103, 232, 249, 0.22)',
                  borderRadius: 12,
                  background: '#020617',
                  color: '#cbd5e1',
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Bar dataKey="spent_amount" name="Spent" stackId="usage" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="remaining_amount" name="Remaining" stackId="usage" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="soft-panel p-5 sm:p-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Projection vs Limit</h3>
          <p className="mt-1 text-sm text-slate-400">Forecasted spending compared with each budget limit.</p>
        </div>

        <div className="mt-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(103, 232, 249, 0.06)' }}
                contentStyle={{
                  border: '1px solid rgba(103, 232, 249, 0.22)',
                  borderRadius: 12,
                  background: '#020617',
                  color: '#cbd5e1',
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Bar dataKey="limit_amount" name="Limit" fill="#67e8f9" radius={[8, 8, 0, 0]} />
              <ProjectionBar data={chartData} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}

export default BudgetCharts
