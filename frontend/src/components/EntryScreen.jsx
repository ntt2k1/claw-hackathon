import { useState } from 'react'

const BUDGET_OPTS = ['500K', '1M', '2M', '5M', '10M+']

const PERSONA_ICONS = {
  "Kẻ Khám Phá Bản Địa": "🔍",
  "Luxury Escapist": "💎",
  "Vibe Architect": "🎉",
  "Power Traveler": "🗺️",
  "Urban Hermit": "🌿",
  "Adventure Nomad": "⚡",
  "Đa Tần Số": "✨",
}

export default function EntryScreen({ user, vibeResult, onDone, onRetakeQuiz, onLogout }) {
  const [tripType, setTripType] = useState('inday')
  const [location, setLocation] = useState('')
  const [duration, setDuration] = useState(8)
  const [error, setError] = useState('')
  const [userNeed, setUserNeed] = useState('')
  const [budgetPill, setBudgetPill] = useState('')
  const [budgetCustom, setBudgetCustom] = useState('')

  function handleContinue() {
    if (!location.trim()) {
      setError('Vui lòng nhập địa điểm của bạn')
      return
    }
    onDone({
      tripType,
      location: location.trim(),
      duration,
      userNeed: userNeed.trim(),
      budget: budgetPill || budgetCustom,
    })
  }

  return (
    <div className="min-h-screen flex flex-col px-container-margin pt-20 pb-32 relative overflow-hidden bg-background">
      <div className="fixed top-0 right-0 w-64 h-64 bg-cyber-purple/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/4 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />

      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-outline-variant flex justify-between items-center px-container-margin h-16 left-0">
        <div className="w-8" />
        <h1 className="font-display text-headline-lg-mobile text-primary tracking-tighter">SOLE</h1>
        {user ? (
          <div className="flex items-center gap-2">
            <p className="font-label text-caption text-on-surface-variant truncate max-w-[100px]">{user.email}</p>
            <button
              onClick={onLogout}
              className="font-label text-caption text-on-surface-variant/60 hover:text-red-400 active:scale-95 transition-all px-1"
              title="Đăng xuất"
            >
              ✕
            </button>
          </div>
        ) : <div className="w-8" />}
      </header>

      <div className="mb-stack-lg mt-4">
        <p className="font-label text-label-md text-primary uppercase tracking-widest bg-primary/10 border border-primary/30 px-4 py-1 rounded-full inline-block mb-stack-sm">
          {user?.has_vibe ? 'Khám phá tiếp' : 'Bắt đầu'}
        </p>
        <h2 className="font-display text-headline-lg-mobile text-on-surface leading-tight tracking-tight">
          Hôm nay bạn muốn đi kiểu nào?
        </h2>

        {vibeResult && user?.has_vibe && (
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2">
              <span className="text-lg">{PERSONA_ICONS[vibeResult.persona] || '✨'}</span>
              <span className="font-label text-label-md text-primary">
                {vibeResult.persona || vibeResult.primary}
              </span>
            </div>
            <button
              onClick={onRetakeQuiz}
              className="font-label text-caption text-on-surface-variant underline underline-offset-2"
            >
              Đổi vibe
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-stack-lg">
        {[
          { value: 'inday', icon: '⏱️', label: 'Trong ngày', sub: 'Vài tiếng đồng hồ' },
          { value: 'multiday', icon: '🗺️', label: 'Chuyến xa', sub: 'Nhiều ngày' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setTripType(opt.value)}
            className={`flex flex-col items-center justify-center rounded-lg p-5 border-2 transition-all active:scale-95 ${
              tripType === opt.value
                ? 'bg-primary/10 border-primary shadow-neon-green'
                : 'bg-surface border border-outline-variant'
            }`}
          >
            <span className="text-3xl mb-2">{opt.icon}</span>
            <span className="font-display text-headline-md text-on-surface">{opt.label}</span>
            <span className="font-label text-caption text-on-surface-variant mt-1">{opt.sub}</span>
          </button>
        ))}
      </div>

      <div className="mb-stack-lg">
        <label className="font-label text-label-md text-on-surface-variant mb-2 block">
          {tripType === 'inday' ? `Thời gian: ${duration} giờ` : `Số ngày: ${duration}`}
        </label>
        <input
          type="range"
          min={tripType === 'inday' ? 2 : 1}
          max={tripType === 'inday' ? 12 : 7}
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Nhu cầu / tâm trạng */}
      <div className="mb-stack-md">
        <label className="font-label text-label-md text-on-surface-variant mb-2 block">
          💭 Nhu cầu / tâm trạng của bạn <span className="text-on-surface-dim/50">(tùy chọn)</span>
        </label>
        <textarea
          rows={2}
          placeholder="VD: Mình đang mệt, muốn tìm chỗ yên tĩnh uống cà phê và đọc sách..."
          value={userNeed}
          onChange={e => setUserNeed(e.target.value)}
          className="w-full bg-surface-container-high border border-outline-variant rounded-DEFAULT px-4 py-3 font-body text-body-md text-on-surface placeholder-on-surface-dim/60 focus:outline-none focus:border-primary resize-none transition-colors"
        />
      </div>

      {/* Ngân sách */}
      <div className="mb-stack-md">
        <label className="font-label text-label-md text-on-surface-variant mb-2 block">
          💰 Ngân sách <span className="text-on-surface-dim/50">(tùy chọn)</span>
        </label>
        <div className="flex gap-2 flex-wrap mb-2">
          {BUDGET_OPTS.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { setBudgetPill(opt === budgetPill ? '' : opt); setBudgetCustom('') }}
              className={`px-3 py-1.5 rounded-full font-label text-label-md border transition-all active:scale-95 ${
                budgetPill === opt
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-surface border-outline-variant text-on-surface-variant'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {!budgetPill && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Nhập số tiền..."
              value={budgetCustom}
              onChange={e => setBudgetCustom(e.target.value)}
              className="flex-1 bg-surface-container-high border border-outline-variant rounded-DEFAULT px-4 py-2.5 font-body text-body-md text-on-surface placeholder-on-surface-dim/60 focus:outline-none focus:border-primary transition-colors"
            />
            <span className="font-label text-label-md text-on-surface-variant">VNĐ</span>
          </div>
        )}
      </div>

      <div className="mb-stack-md">
        <label className="font-label text-label-md text-on-surface-variant mb-2 block">
          {tripType === 'inday' ? '📍 Bạn đang ở đâu?' : '🗺️ Bạn muốn đi đâu?'}
        </label>
        <input
          type="text"
          placeholder={tripType === 'inday' ? 'VD: Quận 1, TP.HCM' : 'VD: Đà Lạt, Hội An, Phú Quốc...'}
          value={location}
          onChange={e => { setLocation(e.target.value); setError('') }}
          className="w-full bg-surface-container-high border border-outline-variant rounded-DEFAULT px-4 py-3 font-body text-body-md text-on-surface placeholder-on-surface-dim/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
        />
        {error && <p className="text-red-400 font-label text-caption mt-1">{error}</p>}
      </div>

      <div className="fixed bottom-16 left-0 w-full px-container-margin pb-4 pt-8 bg-gradient-to-t from-background via-background/95 to-transparent">
        <button
          onClick={handleContinue}
          className="neon-gradient text-on-primary w-full py-4 rounded-full font-label text-label-md uppercase tracking-widest shadow-neon-green active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          {user?.has_vibe ? 'Xem gợi ý ngay' : 'Bắt đầu khám phá'}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}
