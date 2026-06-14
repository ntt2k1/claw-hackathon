import { useState } from 'react'

export default function QuizScreen({ questions, screenIndex, totalScreens, onDone }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [animating, setAnimating] = useState(false)

  const question = questions[currentIdx]
  const globalProgress = ((screenIndex - 1) * questions.length + currentIdx) / (totalScreens * questions.length)

  function handleSelect(letter) {
    if (animating) return
    setSelected(letter)
    const newAnswer = { questionNum: question.num, selectedOption: letter }
    const newAnswers = [...answers, newAnswer]
    setAnimating(true)
    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setAnswers(newAnswers)
        setCurrentIdx(i => i + 1)
        setSelected(null)
        setAnimating(false)
      } else {
        onDone(newAnswers)
      }
    }, 400)
  }

  return (
    <div className="min-h-screen bg-background pb-12 overflow-x-hidden">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-outline-variant px-4 h-20 flex flex-col justify-center gap-2">
        <div className="flex justify-between items-center w-full">
          <span className="text-sm font-semibold text-primary tracking-widest uppercase">Discovery</span>
          <span className="text-sm text-on-surface-variant">
            Step {screenIndex}/{totalScreens}
          </span>
        </div>
        <div className="w-full h-2 bg-surface-high rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.round(globalProgress * 100)}%` }}
          />
        </div>
      </header>

      <main className="pt-28 pb-12 px-4">
        <section className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface leading-tight">
            {question.question}
          </h1>
          <p className="text-sm text-on-surface-variant mt-2">
            Chọn đáp án phù hợp nhất với bạn.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-4 pb-24">
          {question.options.map((opt, i) => {
            const isSelected = selected === opt.letter
            const isOffset = i % 2 === 1

            return (
              <button
                key={opt.letter}
                onClick={() => handleSelect(opt.letter)}
                className={`relative group flex flex-col text-left focus:outline-none transition-transform active:scale-95 ${
                  isOffset ? 'mt-6' : ''
                }`}
              >
                <div
                  className={`rounded-xl overflow-hidden mb-3 transition-all duration-300 ${
                    isSelected ? 'ring-4 ring-primary scale-[1.02]' : ''
                  }`}
                  style={{ aspectRatio: i % 2 === 0 ? '4/5' : '4/6' }}
                >
                  {opt.img ? (
                    <img
                      src={opt.img}
                      alt={opt.imgDesc || opt.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-4xl bg-surface-high"
                    >
                      {opt.letter}
                    </div>
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg border transition-all duration-300 ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary scale-[1.02]'
                      : 'bg-surface border border-outline-variant text-on-surface'
                  }`}
                >
                  <p className="text-sm leading-snug font-medium">{opt.label}</p>
                </div>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
