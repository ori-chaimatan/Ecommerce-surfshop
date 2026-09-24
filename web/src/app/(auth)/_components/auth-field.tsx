'use client';

export function AuthField({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[9px] border border-border px-3.5 py-3 text-sm text-ink placeholder:text-[#9aa7ac] focus:border-horizon focus:outline-none focus:ring-4 focus:ring-horizon/10"
      />
    </div>
  );
}
