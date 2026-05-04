import type { ImageRating } from '../types'

type RatingControlProps = {
  label: string
  value: ImageRating
  activeSymbol: string
  inactiveSymbol: string
  disabled?: boolean
  onChange: (value: ImageRating) => void
}

export function RatingControl({
  label,
  value,
  activeSymbol,
  inactiveSymbol,
  disabled = false,
  onChange,
}: RatingControlProps) {
  return (
    <fieldset className="grid min-w-0 gap-1.5 border-0 p-0 m-0">
      <legend className="p-0 text-[13px] text-[var(--muted)]">{label}</legend>
      <div className="flex items-center gap-[5px]">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            aria-label={`${label}: ${rating}`}
            aria-pressed={value === rating}
            className="min-h-[30px] min-w-[30px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 text-sm text-[var(--ink)] aria-pressed:border-[var(--ink)] aria-pressed:bg-[var(--ink)] aria-pressed:text-[var(--surface)] disabled:cursor-wait disabled:opacity-55"
            disabled={disabled}
            key={rating}
            onClick={() => onChange(value === rating ? null : (rating as ImageRating))}
            type="button"
          >
            {rating <= (value ?? 0) ? activeSymbol : inactiveSymbol}
          </button>
        ))}
        <button
          aria-label={`Clear ${label}`}
          className="min-h-[30px] min-w-[52px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 text-xs text-[var(--muted)] disabled:cursor-wait disabled:opacity-55"
          disabled={disabled || value === null}
          onClick={() => onChange(null)}
          type="button"
        >
          Clear
        </button>
      </div>
    </fieldset>
  )
}
