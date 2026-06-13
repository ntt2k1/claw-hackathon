import { useEffect, useRef } from 'react'
import { VIBE_META } from '../data/questions.js'
import { scoresToPercent } from '../utils/scoring.js'

const VIBE_NAMES_VI = {
  foodie: 'Urban Food Explorer',
  explorer: 'Fearless Explorer',
  culture: 'Culture Seeker',
  adventure: 'Thrill Hunter',
  relaxation: 'Peaceful Wanderer',
}

const VIBE_HASHTAGS = {
  foodie: ['#StreetFood', '#LocalFlavors'],
  explorer: ['#HiddenGems', '#WanderlustVibes'],
  culture: ['#CultureFirst', '#ArtAndHistory'],
  adventure: ['#AdventureAwaits', '#ThrillSeeker'],
  relaxation: ['#SlowTravel', '#UnwindMode'],
}

export default function VibeResult({ vibeResult, onContinue }) {
  const barsRef = useRef([])
  const percentages = vibeResult ? scoresToPercent(vibeResult.scores) : {}

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

  const primary = vibeResult.primary
  const secondary = vibeResult.secondary
  const meta = VIBE_META[primary]
  const sortedVibes = Object.entries(percentages).sort((a, b) => b[1] - a[1])

  return (
    <div className="min-h-screen bg-background pt-20 pb-32 px-container-margin relative overflow-hidden">
      <div className="fixed top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/4 left-0 w-80 h-80 bg-tertiary/10 rounded-full blur-3xl -z-10" />

      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-white/20 shadow-sm flex justify-center items-center h-16 left-0">
        <h1 className="font-display text-headline-lg-mobile text-primary tracking-tighter">SOLE</h1>
      </header>

      <div className="mb-stack-lg text-center">
        <span className="font-label text-label-md text-primary uppercase tracking-widest bg-primary/10 px-4 py-1 rounded-full mb-stack-sm inline-block">
          Your Travel Vibe
        </span>
        <h2 className="font-display text-headline-lg-mobile text-on-surface">
          {secondary ? 'Bạn là một sự kết hợp độc đáo.' : 'Bạn là một traveler đặc biệt.'}
        </h2>
      </div>

      <div className="relative w-full mb-stack-lg rounded-xl overflow-hidden shadow-lg group" style={{ aspectRatio: '4/3' }}>
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #ffe9e5 0%, #ffdad3 100%)' }}
        >
          <div className="text-9xl opacity-20">{meta.label.slice(0, 2)}</div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/10">
          <div className="glass-card w-full p-stack-lg rounded-lg shadow-2xl transform transition-transform group-hover:scale-[1.02] duration-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 sunset-gradient rounded-full flex items-center justify-center mb-stack-md shadow-[0_8px_32px_rgba(255,107,107,0.4)] animate-float text-4xl">
                {meta.label.slice(0, 2)}
              </div>
              <h3 className="font-display text-headline-lg text-primary mb-2">
                {VIBE_NAMES_VI[primary]}
              </h3>
              {secondary && (
                <p className="font-label text-label-md text-on-surface-variant mb-2">
                  + {VIBE_NAMES_VI[secondary]}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="mb-stack-lg space-y-stack-md">
        <div className="flex items-center justify-between px-2">
          <h4 className="font-display text-headline-md text-on-surface">Travel DNA</h4>
          <span className="font-label text-label-md text-primary">Uniquely Yours</span>
        </div>
        <div className="bg-white/50 backdrop-blur-md rounded-lg p-stack-md border border-white/40 shadow-sm space-y-6">
          {sortedVibes.map(([vibe, pct], i) => (
            <div key={vibe} className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="font-label text-label-md text-on-surface-variant">
                  {VIBE_META[vibe].label}
                </span>
                <span className="font-label text-label-md text-primary">{pct}%</span>
              </div>
              <div className="h-4 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  ref={el => barsRef.current[i] = el}
                  data-target={`${pct}%`}
                  className="h-full sunset-gradient rounded-full"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2 mb-section-gap justify-center">
        {(VIBE_HASHTAGS[primary] || []).map(tag => (
          <span key={tag} className="bg-primary/10 text-primary font-label text-label-md px-4 py-2 rounded-full border border-primary/20">
            {tag}
          </span>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 w-full px-container-margin pb-10 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent">
        <button
          onClick={onContinue}
          className="sunset-gradient text-on-primary w-full py-4 rounded-full font-label text-label-md uppercase tracking-widest shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 max-w-sm mx-auto"
        >
          Show Places For Me
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}
