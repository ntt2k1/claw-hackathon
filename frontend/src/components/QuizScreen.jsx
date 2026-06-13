import { useState } from 'react'

export default function QuizScreen({ questions, screenIndex, totalScreens, onDone }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selected, setSelected] = useState(null)
  const [animating, setAnimating] = useState(false)

  const question = questions[currentIdx]
  const totalQuestions = questions.length
  const globalProgress = ((screenIndex - 1) * 5 + currentIdx) / (totalScreens * 5)

  function handleSelect(vibe) {
    if (animating) return
    setSelected(vibe)
    const newAnswers = { ...answers, [question.id]: vibe }
    setAnimating(true)
    setTimeout(() => {
      if (currentIdx < totalQuestions - 1) {
        setAnswers(newAnswers)
        setCurrentIdx(i => i + 1)
        setSelected(null)
        setAnimating(false)
      } else {
        onDone(newAnswers)
      }
    }, 400)
  }

  const masonryDelay = (i) => `${(i + 1) * 0.1}s`

  return (
    <div
      className="min-h-screen bg-background pb-12 overflow-x-hidden"
      onMouseMove={(e) => {
        const x = e.clientX / window.innerWidth
        const y = e.clientY / window.innerHeight
        document.body.style.backgroundImage = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,107,107,0.05) 0%, transparent 50%)`
      }}
    >
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl px-container-margin h-20 flex flex-col justify-center gap-2">
        <div className="flex justify-between items-center w-full">
          <span className="font-label text-label-md text-primary tracking-widest uppercase">Discovery</span>
          <span className="font-label text-label-md text-on-surface-variant">
            Step {screenIndex}/{totalScreens}
          </span>
        </div>
        <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className="h-full sunset-gradient rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.round(globalProgress * 100)}%` }}
          />
        </div>
      </header>

      <main className="pt-28 pb-12 px-container-margin">
        <section className="mb-stack-lg">
          <h1 className="font-display text-headline-lg-mobile text-on-surface leading-tight tracking-tight">
            {question.question}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant mt-2">
            Chọn đáp án phù hợp nhất với bạn.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-4 pb-24" style={{ gridAutoRows: 'auto' }}>
          {question.options.map((opt, i) => {
            const isSelected = selected === opt.vibe
            const isEven = i % 2 === 1

            return (
              <button
                key={opt.vibe}
                onClick={() => handleSelect(opt.vibe)}
                className={`animate-slide-in relative group flex flex-col text-left focus:outline-none transition-transform active:scale-95 ${
                  isEven ? 'mt-6' : ''
                }`}
                style={{ animationDelay: masonryDelay(i), opacity: 0, animationFillMode: 'forwards' }}
              >
                <div
                  className={`overflow-hidden rounded-lg mb-3 transition-all duration-300 ${
                    isSelected ? 'ring-4 ring-primary scale-[1.02]' : ''
                  }`}
                  style={{ aspectRatio: i % 2 === 0 ? '4/5' : '4/6' }}
                >
                  <div
                    className="w-full h-full flex items-center justify-center text-5xl"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, #ff6b6b 0%, #ae2f34 100%)'
                        : 'linear-gradient(135deg, #ffe9e5 0%, #ffdad3 100%)',
                    }}
                  >
                    {opt.text.slice(0, 2)}
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container border-primary scale-[1.02]'
                      : 'bg-surface-container-low text-on-surface border-white/40'
                  }`}
                >
                  <p className="font-body text-body-md leading-snug">{opt.text.slice(3)}</p>
                </div>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
