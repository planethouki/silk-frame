type AgeGateProps = {
  onConfirm: () => void
}

export function AgeGate({ onConfirm }: AgeGateProps) {
  return (
    <main
      className="grid min-h-[100svh] items-center p-6"
      aria-labelledby="age-gate-title"
    >
      <section
        className="grid w-[min(100%,560px)] max-w-[560px] justify-self-center gap-[18px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8"
        role="dialog"
        aria-modal="true"
      >
        <p className="mb-2 mt-0 text-[13px] font-[650] uppercase text-[var(--muted)]">
          Age verification
        </p>
        <h1 className="text-[clamp(42px,10vw,76px)]" id="age-gate-title">
          18+ only
        </h1>
        <p className="m-0 text-[var(--text)]">
          年齢制限のある内容を含む可能性があります。閲覧には年齢に応じた判断をお願いします。
        </p>
        <button
          type="button"
          className="justify-self-start rounded-full border-0 bg-[var(--ink)] px-[18px] py-2.5 font-[inherit] text-[var(--surface)] disabled:cursor-wait disabled:opacity-[0.62]"
          onClick={onConfirm}
        >
          18歳以上です
        </button>
      </section>
    </main>
  )
}
