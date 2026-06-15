import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'

export default function Itinerary({ recommendations, loading, tripType, location, onRestart }) {
  const [ratings, setRatings] = useState({})

  async function handleRate(item, index, rating) {
    const placeId = `${index}-${(item.name || '').replace(/\s+/g, '-').toLowerCase()}`
    setRatings(prev => ({ ...prev, [placeId]: rating }))
    try {
      await api.ratePlace({
        placeId,
        placeName: item.name || '',
        category: item.category || 'general',
        rating,
      })
    } catch (e) {
      console.warn('Rating failed:', e)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32 relative overflow-hidden">
      <div className="fixed top-0 right-0 w-64 h-64 bg-cyber-purple/10 rounded-full blur-3xl -z-10" />

      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-outline-variant flex justify-center items-center h-16 left-0">
        <h1 className="font-display text-headline-lg-mobile text-primary tracking-tighter">SOLE</h1>
      </header>

      <main className="pt-24 pb-12 px-container-margin">
        <div className="mb-stack-lg">
          <span className="font-label text-label-md text-primary uppercase tracking-widest bg-primary/10 px-4 py-1 rounded-full inline-block mb-stack-sm">
            {tripType === 'inday' ? 'Lịch trình trong ngày' : 'Lịch trình chuyến xa'}
          </span>
          <h2 className="font-display text-headline-lg-mobile text-on-surface leading-tight">
            Dành riêng cho bạn
          </h2>
          {location && (
            <p className="font-label text-label-md text-on-surface-variant mt-1">
              📍 Từ: {location}
            </p>
          )}
        </div>

        {loading && <SkeletonItinerary />}

        {!loading && recommendations && (
          <div className="space-y-4">
            {recommendations.itinerary?.map((item, i) => (
              <div
                key={i}
                className="animate-slide-in flex gap-4 items-start"
                style={{ animationDelay: `${i * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-4 h-4 bg-primary rounded-full mt-1 shadow-neon-green" />
                  {i < recommendations.itinerary.length - 1 && (
                    <div className="w-0.5 flex-1 bg-primary/20 mt-1" style={{ minHeight: '2rem' }} />
                  )}
                </div>

                <div className="bg-surface border border-outline-variant rounded-xl flex-1 p-stack-md mb-2">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-display text-headline-md text-on-surface leading-tight">
                      {item.time && <span className="text-primary font-bold mr-2">{item.time}</span>}
                      {item.name}
                    </p>
                  </div>
                  {item.description && (
                    <p className="font-body text-body-md text-on-surface-variant mb-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex gap-3 flex-wrap">
                    {item.duration_note && (
                      <span className="font-label text-caption bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                        ⏱ {item.duration_note}
                      </span>
                    )}
                    {item.distance_from_prev && (
                      <span className="font-label text-caption bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                        📍 {item.distance_from_prev}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-outline-variant flex gap-3">
                    {(() => {
                      const placeId = `${i}-${(item.name || '').replace(/\s+/g, '-').toLowerCase()}`
                      const current = ratings[placeId]
                      return (
                        <>
                          <button
                            onClick={() => handleRate(item, i, 'like')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-label transition-colors ${
                              current === 'like'
                                ? 'bg-primary/10 border border-primary text-primary'
                                : 'bg-surface-high border border-outline-variant text-on-surface-variant hover:border-primary/50'
                            }`}
                          >
                            👍 <span>Thích</span>
                          </button>
                          <button
                            onClick={() => handleRate(item, i, 'dislike')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-label transition-colors ${
                              current === 'dislike'
                                ? 'bg-red-500/10 border border-red-500 text-red-400'
                                : 'bg-surface-high border border-outline-variant text-on-surface-variant hover:border-red-500/50'
                            }`}
                          >
                            👎 <span>Không hợp</span>
                          </button>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !recommendations && (
          <div className="text-center py-12 text-on-surface-variant">
            <p className="font-body text-body-lg">Không thể tải gợi ý. Vui lòng thử lại.</p>
          </div>
        )}
      </main>

      {!loading && (
        <div className="fixed bottom-16 left-0 w-full px-container-margin pb-4 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent">
          <button
            onClick={onRestart}
            className="w-full bg-surface border-2 border-primary/30 text-primary py-4 rounded-full font-label text-label-md uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">refresh</span>
            Lên kế hoạch lại
          </button>
        </div>
      )}
    </div>
  )
}

const STEPS = [
  { icon: '🧠', label: 'Phân tích vibe của bạn...' },
  { icon: '🔍', label: 'Tìm kiếm địa điểm phù hợp...' },
  { icon: '🗺️', label: 'Sắp xếp lịch trình tối ưu...' },
]

function SkeletonItinerary() {
  const [elapsed, setElapsed] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const stepper = setInterval(() => {
      setStepIdx(i => (i + 1) % STEPS.length)
    }, 3000)
    return () => clearInterval(stepper)
  }, [])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const timeStr = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}`
    : `${secs}s`

  return (
    <div className="space-y-6">
      {/* Timer card */}
      <div className="glass-card rounded-xl p-6 text-center">
        <div className="text-4xl mb-3 animate-float inline-block">{STEPS[stepIdx].icon}</div>
        <p className="font-label text-label-md text-on-surface-variant mb-3">
          {STEPS[stepIdx].label}
        </p>
        <div className="inline-flex items-center gap-2 neon-gradient px-4 py-2 rounded-full">
          <span className="material-symbols-outlined text-on-primary text-base">schedule</span>
          <span className="font-label text-label-md text-on-primary tabular-nums">{timeStr}</span>
        </div>
        <p className="font-label text-caption text-on-surface-variant mt-3">
          LLM đang xử lý — thường mất 3-5 phút
        </p>
      </div>

      {/* Skeleton cards */}
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-4 items-start">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-4 h-4 bg-primary/30 rounded-full mt-1" />
              {i < 4 && <div className="w-0.5 bg-primary/10 mt-1" style={{ minHeight: '2rem' }} />}
            </div>
            <div className="flex-1 bg-surface-high animate-pulse rounded-xl p-stack-md">
              <div className="h-4 bg-surface-container-high rounded w-3/4 mb-2" />
              <div className="h-3 bg-surface-container-high rounded w-full mb-1" />
              <div className="h-3 bg-surface-container-high rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
