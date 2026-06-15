import { useEffect, useRef } from 'react'

const AXIS_ICONS = {
  "Ẩm thực": "🍜",
  "Văn hoá": "🏛️",
  "Thiên nhiên": "🌿",
  "Phiêu lưu": "⚡",
  "Sang chảnh": "💎",
  "Giao lưu": "🎉",
  "Tọa độ ngách": "🔍",
  "Thư giãn": "😌",
  "Nhiếp ảnh": "📸",
  "Hiệu quả": "🗺️",
}

export default function VibeResult({ vibeResult, onContinue }) {
  const barsRef = useRef([])

  useEffect(() => {
    barsRef.current.forEach((bar, i) => {
      if (!bar) return
      const target = bar.dataset.target
      bar.style.width = '0%'
      setTimeout(() => {
        bar.style.transition = 'width 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
        bar.style.width = target
      }, 400 + i * 100)
    })
  }, [])

  if (!vibeResult) return null

  const { axes, primary, persona, tagline } = vibeResult
  const sortedAxes = Object.entries(axes || {}).sort((a, b) => b[1] - a[1])

  return (
    <div className="min-h-screen bg-background pt-20 pb-32 px-container-margin relative overflow-hidden">
      <div className="fixed top-0 right-0 w-64 h-64 bg-cyber-purple/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/4 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />

      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-outline-variant flex justify-center items-center h-16 left-0">
        <h1 className="font-display text-headline-lg-mobile text-primary tracking-tighter">SOLE</h1>
      </header>

      <div className="mb-stack-lg text-center">
        <span className="font-label text-label-md text-primary uppercase tracking-widest bg-primary/10 px-4 py-1 rounded-full mb-stack-sm inline-block">
          Your Travel DNA
        </span>
        <h2 className="font-display text-headline-lg-mobile text-on-surface">
          {persona}
        </h2>
        <p className="font-body text-body-md text-on-surface-variant mt-2 italic">
          &ldquo;{tagline}&rdquo;
        </p>
      </div>

      <div className="relative w-full mb-stack-lg rounded-xl overflow-hidden shadow-card group" style={{ aspectRatio: '4/3' }}>
        <div
          className="absolute inset-0 flex items-center justify-center bg-surface border border-outline-variant"
        >
          <div className="text-9xl opacity-10">{AXIS_ICONS[primary] || '✨'}</div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="glass-card w-full p-stack-lg rounded-xl shadow-card transform transition-transform group-hover:scale-[1.02] duration-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-stack-md animate-float text-4xl">
                {AXIS_ICONS[primary] || '✨'}
              </div>
              <h3 className="font-display text-headline-lg text-primary font-black mb-2">
                {persona}
              </h3>
              <p className="font-body text-body-md text-on-surface-variant italic">
                {tagline}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-stack-lg space-y-stack-md">
        <div className="flex items-center justify-between px-2">
          <h4 className="font-display text-headline-md text-on-surface">Travel DNA</h4>
          <span className="font-label text-label-md text-primary">Uniquely Yours</span>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-stack-md space-y-6">
          {sortedAxes.map(([axis, pct], i) => (
            <div key={axis} className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="font-label text-label-md text-on-surface-variant">
                  {AXIS_ICONS[axis]} {axis}
                </span>
                <span className="font-label text-label-md text-primary">{pct}%</span>
              </div>
              <div className="h-4 w-full bg-surface-high rounded-full overflow-hidden">
                <div
                  ref={el => barsRef.current[i] = el}
                  data-target={`${pct}%`}
                  className="h-full bg-primary rounded-full"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="fixed bottom-16 left-0 w-full px-container-margin pb-4 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent">
        <button
          onClick={onContinue}
          className="neon-gradient text-on-primary w-full py-4 rounded-full font-label text-label-md uppercase tracking-widest shadow-neon-green active:scale-95 transition-transform flex items-center justify-center gap-2 max-w-sm mx-auto"
        >
          Show Places For Me
        </button>
      </div>
    </div>
  )
}
