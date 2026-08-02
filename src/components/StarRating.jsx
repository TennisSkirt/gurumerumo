// 별점 표시/입력 겸용. readOnly 면 표시만.
export default function StarRating({ value = 0, onChange, size = 22, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="stars" style={{ fontSize: size }}>
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          className={'star' + (n <= value ? ' on' : '') + (readOnly ? ' ro' : '')}
          onClick={readOnly ? undefined : () => onChange(n === value ? 0 : n)}
          aria-label={`${n}점`}
          disabled={readOnly}
        >
          ★
        </button>
      ))}
    </div>
  )
}
