import { useState, useEffect, useMemo } from 'react'
import { api } from '../api.js'

function buildMapsUrl(item, place) {
  const q = [item.name, item.address || place?.address, place?.district]
    .filter(Boolean)
    .join(' ')
  return `https://maps.google.com/?q=${encodeURIComponent(q)}`
}

function ExpiredState() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
      <span className="text-5xl">⏰</span>
      <h2 className="font-display text-headline-lg-mobile text-on-surface">Link đã hết hạn</h2>
      <p className="font-body text-body-md text-on-surface-variant">Link chia sẻ này không còn hiệu lực.</p>
      <a
        href="/"
        className="neon-gradient text-on-primary font-label text-label-md uppercase tracking-widest px-8 py-4 rounded-full shadow-neon-green"
      >
        Tạo lịch trình của riêng bạn →
      </a>
    </div>
  )
}

function ReadOnlyItinerary({ data }) {
  const placeByName = useMemo(
    () => Object.fromEntries((data.places || []).map(p => [p.name, p])),
    [data]
  )

  return (
    <div className="min-h-screen bg-background pb-16 relative overflow-hidden">
      <header className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-outline-variant flex justify-center items-center h-16">
        <h1 className="font-display text-headline-lg-mobile text-primary tracking-tighter">SOLE</h1>
      </header>

      <main className="pt-6 pb-12 px-4">
        <div className="mb-6">
          <span className="font-label text-label-md text-primary uppercase tracking-widest bg-primary/10 px-4 py-1 rounded-full inline-block mb-3">
            Lịch trình được chia sẻ
          </span>
          <h2 className="font-display text-headline-lg-mobile text-on-surface leading-tight">
            {data.trip_type === 'inday' ? 'Lịch trình trong ngày' : 'Lịch trình chuyến xa'}
          </h2>
          {data.location && (
            <p className="font-label text-label-md text-on-surface-variant mt-1">
              📍 {data.location}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {data.itinerary?.map((item, i) => {
            const place = placeByName[item.name]
            const sourceUrl = place?.source_url
            return (
              <div
                key={i}
                className="animate-slide-in flex gap-4 items-start"
                style={{ animationDelay: `${i * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-4 h-4 bg-primary rounded-full mt-1 shadow-neon-green" />
                  {i < data.itinerary.length - 1 && (
                    <div className="w-0.5 flex-1 bg-primary/20 mt-1" style={{ minHeight: '2rem' }} />
                  )}
                </div>

                <div className="bg-surface border border-outline-variant rounded-xl flex-1 p-4 mb-2">
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
                  <div className="flex gap-3 flex-wrap mb-3">
                    {item.duration_note && (
                      <span className="font-label text-caption bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                        ⏱ {item.duration_note}
                      </span>
                    )}
                    {item.distance_from_prev && (
                      <span className="font-label text-caption bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                        🚶 {item.distance_from_prev}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    {item.name && (
                      <a
                        href={buildMapsUrl(item, place)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-high border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors text-sm"
                        title="Xem trên Google Maps"
                      >
                        📍
                      </a>
                    )}
                    {sourceUrl && (
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-high border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors text-sm"
                        title="Đọc thêm"
                      >
                        🔗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <a
            href="/"
            className="neon-gradient text-on-primary font-label text-label-md uppercase tracking-widest px-8 py-4 rounded-full shadow-neon-green inline-block"
          >
            Tạo lịch trình của riêng bạn →
          </a>
        </div>
      </main>
    </div>
  )
}

export default function SharedItinerary({ token }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getShare(token)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-body-md text-on-surface-variant animate-pulse">Đang tải lịch trình...</p>
      </div>
    )
  }
  if (error) return <ExpiredState />
  return <ReadOnlyItinerary data={data} />
}
