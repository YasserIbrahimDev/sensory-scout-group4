import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
}

/** A labelled text input that shows its hint and error message below it. */
export default function TextField({ label, value, onChange, hint, error, ...inputProps }: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="text-field">
      <label htmlFor={id} className="text-field__label">{label}</label>
      {hint && <p id={hintId} className="text-field__hint">{hint}</p>}
      <input
        {...inputProps}
        id={id}
        className="text-field__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {error && <p id={errorId} className="field-error">{error}</p>}
    </div>
  );
}
