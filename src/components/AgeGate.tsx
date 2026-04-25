type AgeGateProps = {
  onConfirm: () => void
}

export function AgeGate({ onConfirm }: AgeGateProps) {
  return (
    <main className="age-gate" aria-labelledby="age-gate-title">
      <section className="age-gate-panel" role="dialog" aria-modal="true">
        <p className="eyebrow">Age verification</p>
        <h1 id="age-gate-title">18+ only</h1>
        <p>
          年齢制限のある内容を含む可能性があります。閲覧には年齢に応じた判断をお願いします。
        </p>
        <button type="button" className="primary-action" onClick={onConfirm}>
          18歳以上です
        </button>
      </section>
    </main>
  )
}
