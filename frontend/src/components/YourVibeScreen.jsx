import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

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

export default function YourVibeScreen({ vibeResult, user, onLogout, onRetakeQuiz }) {
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
  const radarData = Object.entries(scores).map(([axis, value]) => ({
    axis,
    value,
    fullMark: 100,
  }))

  return (
    <div className="min-h-screen bg-background pb-24 overflow-y-auto">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-outline-variant flex justify-center items-center h-16">
        <h1 className="font-display text-headline-lg-mobile text-primary tracking-tighter">SOLE</h1>
      </header>

      <main className="pt-20 px-5">
        {/* Hero */}
        <div className="mt-4 mb-6 text-center py-8 px-4 rounded-2xl bg-surface border border-primary/20">
          <div className="text-6xl mb-3">{personaMeta.icon}</div>
          <h2 className="font-display text-2xl text-primary font-bold mb-2">{vibeResult.persona}</h2>
          <p className="font-body text-body-md text-on-surface-variant italic">"{vibeResult.tagline}"</p>
        </div>

        {/* Radar Chart */}
        <section className="mb-4">
          <h3 className="font-label text-label-md text-on-surface-variant uppercase tracking-widest mb-3">Travel DNA</h3>
          <div className="bg-surface border border-outline-variant rounded-xl p-4">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#514255" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fill: '#888888', fontSize: 10, fontFamily: 'Montserrat' }}
                />
                <Radar
                  dataKey="value"
                  stroke="#00FFA3"
                  fill="#00FFA3"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Đổi tần số */}
        <div className="mb-6">
          <button
            onClick={onRetakeQuiz}
            className="w-full py-3 rounded-full border-2 border-cyber-purple text-cyber-purple font-label text-label-md uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            ⚡ Đổi tần số
          </button>
        </div>

        {/* Unsplash photos */}
        {photos.length > 0 && (
          <section className="mb-6">
            <h3 className="font-label text-label-md text-on-surface-variant uppercase tracking-widest mb-3">Địa điểm phù hợp với bạn</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {photos.map(photo => (
                <div key={photo.id} className="flex-shrink-0 w-40 h-28 rounded-xl overflow-hidden shadow-card">
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

        {/* Account */}
        <section className="mb-6">
          {user && (
            <p className="font-label text-caption text-on-surface-variant text-center mb-3">
              {user.email}
            </p>
          )}
          <button
            onClick={onLogout}
            className="w-full py-3 rounded-full border border-outline-variant text-on-surface-variant font-label text-label-md hover:border-red-500/50 hover:text-red-400 active:scale-95 transition-all"
          >
            Đăng xuất
          </button>
        </section>
      </main>
    </div>
  )
}
