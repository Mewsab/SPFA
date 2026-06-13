function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  autoComplete,
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-200">
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        className="form-input"
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      {error ? <span className="text-sm text-rose-300">{error}</span> : null}
    </label>
  )
}

export default FormInput
