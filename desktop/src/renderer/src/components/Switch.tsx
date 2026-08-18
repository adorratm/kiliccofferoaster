type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  id?: string;
  disabled?: boolean;
};

export function Switch({ checked, onChange, label, description, id, disabled }: Props) {
  const inputId = id || (label ? `sw-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <label
      htmlFor={inputId}
      className={`group inline-flex cursor-pointer items-start gap-3 select-none ${
        disabled ? 'pointer-events-none opacity-50' : ''
      }`}
    >
      <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
        />
        <span
          className={`pointer-events-none flex h-5 w-5 items-center justify-center border transition-[border-color,background-color] duration-150 ${
            checked
              ? 'border-accent bg-accent text-white'
              : 'border-border-muted bg-background group-hover:border-muted'
          }`}
          aria-hidden
        >
          {checked ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6.2L4.6 9L10 3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="square"
              />
            </svg>
          ) : null}
        </span>
      </span>
      {label || description ? (
        <span className="min-w-0">
          {label ? <span className="block text-sm text-foreground">{label}</span> : null}
          {description ? <span className="mt-0.5 block text-xs text-muted">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}
