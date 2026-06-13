const occupationOptions = [
  { value: 'student', label: 'Student' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'employed_adult', label: 'Employee' },
  { value: 'other', label: 'Other' },
]

function OccupationSelect({ value, onChange, error }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-200">Occupation Type</span>
      <select className="form-input" name="occupation_type" value={value} onChange={onChange}>
        {occupationOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-sm text-rose-300">{error}</span> : null}
    </label>
  )
}

export default OccupationSelect
