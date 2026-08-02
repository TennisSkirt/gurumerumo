// 별점 표시/입력 겸용. readOnly 면 표시만(버튼 대신 span — 카드 버튼 안에 중첩 방지).
export default function StarRating({ value = 0, onChange, size = 22, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5]

  if (readOnly) {
    return (
      <div className="stars" style={{ fontSize: size }}>
        {stars.map((n) => (
          <span key={n} className={'star ro' + (n <= value ? ' on' : '')}>★</span>
        ))}
      </div>
    )
  }

  return (
    <div className="stars" style={{ fontSize: size }}>
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          className={'star' + (n <= value ? ' on' : '')}
          onClick={() => onChange(n === value ? 0 : n)}
          aria-label={`${n}점`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
