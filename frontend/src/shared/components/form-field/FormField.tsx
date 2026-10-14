import { forwardRef, type HTMLAttributes } from 'react';

export interface FormFieldOption {
  value: string;
  label: string;
}

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown under the field in `text-danger`; marks the control `aria-invalid`. */
  error?: string;
  hint?: string;
  /** Renders a `<select>`; `placeholder` becomes its empty first option. */
  options?: FormFieldOption[];
  type?: 'text' | 'email' | 'tel';
  placeholder?: string;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  disabled?: boolean;
}

const CONTROL =
  'w-full rounded-[9px] border bg-white px-3.5 py-3 text-[15px] leading-[1.2] text-ink placeholder:text-[#9aa7ac] focus:border-horizon focus:outline-none focus:ring-[3px] focus:ring-horizon/[.12] disabled:bg-surface';

/** A labelled input or select with its hint and inline error: the design's `.co-field`, with the design system's mono uppercase label and 15px input. */
export const FormField = forwardRef<HTMLInputElement & HTMLSelectElement, FormFieldProps>(function FormField(
  { id, label, value, onChange, error, hint, options, type = 'text', placeholder, autoComplete, inputMode, maxLength, disabled },
  ref
) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const control = {
    id,
    ref,
    value,
    disabled,
    autoComplete,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': describedBy,
    className: `${CONTROL} ${error ? 'border-danger' : 'border-border'}`,
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-xs uppercase tracking-[0.06em] text-muted">
        {label}
      </label>
      {options ? (
        <select {...control} onChange={(event) => onChange(event.target.value)}>
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...control}
          type={type}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
