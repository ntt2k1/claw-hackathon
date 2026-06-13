import { useState } from 'react'
import { RATING_QUESTIONS, VIBE_META } from '../data/questions.js'

export default function RatingScreen({ screenIndex, totalScreens, onDone }) {
  const [ratings, setRatings] = useState(
    Object.fromEntries(RATING_QUESTIONS.map(q => [q.id, 0]))
  )
  const allAnswered = Object.values(ratings).every(v => v > 0)

  function handleRate(id, value) {
    setRatings(prev => ({ ...prev, [id]: value }))
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl px-container-margin h-20 flex flex-col justify-center gap-2">
        <div className="flex justify-between items-center w-full">
          <span className="font-label text-label-md text-primary tracking-widest uppercase">Discovery</span>
          <span className="font-label text-label-md text-on-surface-variant">
            Step {screenIndex}/{totalScreens}
          </span>
        </div>
        <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div className="h-full sunset-gradient rounded-full w-full transition-all duration-700" />
        </div>
      </header>

      <main className="pt-28 pb-12 px-container-margin">
        <section className="mb-stack-lg">
          <h1 className="font-display text-headline-lg-mobile text-on-surface leading-tight tracking-tight">
            Bạn đồng ý đến mức nào?
          </h1>
          <p className="font-body text-body-md text-on-surface-variant mt-2">
            1 = Hoàn toàn không đồng ý &nbsp;·&nbsp; 5 = Hoàn toàn đồng ý
          </p>
        </section>

        <div className="flex flex-col gap-stack-md">
          {RATING_QUESTIONS.map((q, idx) => {
            const current = ratings[q.id]
            return (
              <div
                key={q.id}
                className="animate-slide-in glass-card rounded-lg p-stack-md"
                style={{ animationDelay: `${(idx + 1) * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <p className="font-body text-body-md text-on-surface mb-stack-md leading-snug">
                  "{q.statement}"
                </p>
                <div className="flex gap-2 justify-between">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      onClick={() => handleRate(q.id, val)}
                      className={`flex-1 h-10 rounded-DEFAULT font-label text-label-md transition-all active:scale-95 ${
                        current === val
                          ? 'sunset-gradient text-on-primary shadow-md scale-110'
                          : current > 0 && val <= current
                            ? 'bg-primary/20 text-primary'
                            : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <div
        className={`fixed bottom-0 left-0 w-full px-container-margin pb-10 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent transition-all duration-300 ${
          allAnswered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
        }`}
      >
        <button
          onClick={() => onDone(ratings)}
          className="sunset-gradient text-on-primary w-full py-4 rounded-full font-label text-label-md uppercase tracking-widest shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          Xem kết quả vibe
          <span className="material-symbols-outlined">auto_awesome</span>
        </button>
      </div>
    </div>
  )
}
