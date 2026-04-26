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
    <fieldset className="rating-control">
      <legend>{label}</legend>
      <div>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            aria-label={`${label}: ${rating}`}
            aria-pressed={value === rating}
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
          className="rating-clear"
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
