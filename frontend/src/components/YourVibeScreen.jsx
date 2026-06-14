import { useEffect, useState } from 'react'
import { api } from '../api.js'

const PERSONA_META = {
  "Kẻ Khám Phá Bản Địa": { icon: "🔍", keyword: "hidden alley vietnam" },
  "Luxury Escapist":       { icon: "💎", keyword: "luxury resort vietnam" },
  "Vibe Architect":        { icon: "🎉", keyword: "rooftop bar vietnam night" },
  "Power Traveler":        { icon: "🗺️", keyword: "city landmarks vietnam" },
  "Urban Hermit":          { icon: "🌿", keyword: "hidden gem nature vietnam" },
  "Adventure Nomad":       { icon: "⚡", keyword: "trekking vietnam" },
  "Đa Tần Số":             { icon: "✨", keyword: "vietnam travel" },
}

const AXIS_ICONS = {
  "Ẩm thực": "🍜", "Văn hoá": "🏛️", "Thiên nhiên": "🌿", "Phiêu lưu": "⚡",
  "Sang chảnh": "💎", "Giao lưu": "🎉", "Tọa độ ngách": "🔍", "Thư giãn": "😌",
  "Nhiếp ảnh": "📸", "Hiệu quả": "🗺️",
}

function useUnsplash(keyword) {
  const [photos, setPhotos] = useState([])
  useEffect(() => {
    if (!keyword) return
    const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
    if (!key) return
    fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=6&orientation=landscape`, {
      headers: { Authorization: `Client-ID ${key}` },
    })
      .then(r => r.json())
      .then(data => setPhotos(data.results || []))
      .catch(() => {})
  }, [keyword])
  return photos
}

export default function YourVibeScreen({ vibeResult }) {
  const [ratings, setRatings] = useState([])

  useEffect(() => {
    api.getRatings()
      .then(data => setRatings(data.ratings || []))
      .catch(() => {})
  }, [])

  // Compute meta before hooks (hook must be called unconditionally)
  const personaMeta = vibeResult
    ? (PERSONA_META[vibeResult.persona] || { icon: '✨', keyword: 'vietnam travel' })
    : { icon: '✨', keyword: '' }
  const photos = useUnsplash(personaMeta.keyword)  // called unconditionally — correct

  if (!vibeResult) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-20 text-center">
        <span className="text-5xl mb-4">✨</span>
        <h2 className="font-display text-headline-lg-mobile text-on-surface mb-2">Chưa có vibe</h2>
        <p className="font-body text-body-md text-on-surface-variant">Làm bài quiz để khám phá vibe của bạn nhé!</p>
      </div>
    )
  }

  // Aggregate ratings by category
  const ratingsByCategory = {}
  for (const r of ratings) {
    const cat = r.category || 'other'
    if (!ratingsByCategory[cat]) ratingsByCategory[cat] = { like: 0, dislike: 0 }
    ratingsByCategory[cat][r.rating === 'like' ? 'like' : 'dislike']++
  }

  const scores = vibeResult.axes || {}
  const maxScore = Math.max(...Object.values(scores), 1)
  const scoreEntries = Object.entries(scores).sort((a, b) => b[1] - a[1])

  return (
    <div className="min-h-screen bg-background pb-24 overflow-y-auto">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-white/20 shadow-sm flex justify-center items-center h-16">
        <h1 className="font-display text-headline-lg-mobile text-primary tracking-tighter">SOLE</h1>
      </header>

      <main className="pt-20 px-5">
        {/* Hero */}
        <div className="mt-4 mb-6 text-center py-8 px-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
          <div className="text-6xl mb-3">{personaMeta.icon}</div>
          <h2 className="font-display text-2xl text-primary font-bold mb-2">{vibeResult.persona}</h2>
          <p className="font-body text-body-md text-on-surface-variant italic">"{vibeResult.tagline}"</p>
        </div>

        {/* Score grid */}
        <section className="mb-6">
          <h3 className="font-label text-label-md text-on-surface-variant uppercase tracking-widest mb-3">Điểm vibe của bạn</h3>
          <div className="grid grid-cols-2 gap-3">
            {scoreEntries.map(([vibe, score]) => {
              const pct = Math.round((score / maxScore) * 100)
              return (
                <div key={vibe} className="glass-card rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{AXIS_ICONS[vibe] || '🌟'}</div>
                  <div className="font-label text-label-md text-primary font-semibold">{AXIS_ICONS[vibe]} {vibe}</div>
                  <div className="mt-2 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="font-label text-caption text-on-surface-variant mt-1">{pct}%</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Unsplash photos */}
        {photos.length > 0 && (
          <section className="mb-6">
            <h3 className="font-label text-label-md text-on-surface-variant uppercase tracking-widest mb-3">Địa điểm phù hợp với bạn</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {photos.map(photo => (
                <div key={photo.id} className="flex-shrink-0 w-40 h-28 rounded-xl overflow-hidden shadow-md">
                  <img
                    src={photo.urls.small}
                    alt={photo.alt_description || 'travel'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rating insights */}
        <section className="mb-6">
          <h3 className="font-label text-label-md text-on-surface-variant uppercase tracking-widest mb-3">Đánh giá của bạn</h3>
          {ratings.length === 0 ? (
            <p className="font-body text-body-md text-on-surface-variant text-center py-4">Chưa có đánh giá địa điểm nào</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(ratingsByCategory).map(([cat, counts]) => (
                <div key={cat} className="glass-card rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="font-body text-body-md text-on-surface capitalize">{AXIS_ICONS[cat] || ''} {cat}</span>
                  <div className="flex gap-3 text-sm">
                    {counts.like > 0 && <span>👍 {counts.like}</span>}
                    {counts.dislike > 0 && <span>👎 {counts.dislike}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
