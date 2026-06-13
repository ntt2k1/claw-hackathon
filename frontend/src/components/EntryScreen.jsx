import { useState } from 'react'

export default function EntryScreen({ user, onDone }) {
  const [tripType, setTripType] = useState('inday')
  const [location, setLocation] = useState('')
  const [duration, setDuration] = useState(8)
  const [error, setError] = useState('')

  function handleContinue() {
    if (!location.trim()) {
      setError('Vui lòng nhập địa điểm của bạn')
      return
    }
    onDone({ tripType, location: location.trim(), duration })
  }

  return (
    <div className="min-h-screen flex flex-col px-container-margin pt-20 pb-32 relative overflow-hidden">
      <div className="fixed top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/4 left-0 w-80 h-80 bg-tertiary/10 rounded-full blur-3xl -z-10" />

      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-white/20 shadow-sm flex justify-between items-center px-container-margin h-16 left-0">
        <div className="w-8" />
        <h1 className="font-display text-headline-lg-mobile text-primary tracking-tighter">SOLE</h1>
        {user && (
          <p className="font-label text-caption text-on-surface-variant truncate max-w-[120px]">{user.email}</p>
        )}
      </header>

      <div className="mb-stack-lg mt-4">
        <p className="font-label text-label-md text-primary uppercase tracking-widest bg-primary/10 px-4 py-1 rounded-full inline-block mb-stack-sm">
          {user?.has_vibe ? 'Khám phá tiếp' : 'Bắt đầu'}
        </p>
        <h2 className="font-display text-headline-lg-mobile text-on-surface leading-tight tracking-tight">
          Hôm nay bạn muốn đi kiểu nào?
        </h2>
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
                ? 'bg-primary-container border-primary shadow-md'
                : 'bg-surface-container-low border-transparent'
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

      <div className="mb-stack-md">
        <label className="font-label text-label-md text-on-surface-variant mb-2 block">
          📍 Bạn đang ở đâu?
        </label>
        <input
          type="text"
          placeholder="VD: Quận 1, TP.HCM"
          value={location}
          onChange={e => { setLocation(e.target.value); setError('') }}
          className="w-full bg-white/70 backdrop-blur border border-white/30 rounded-DEFAULT px-4 py-3 font-body text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary"
        />
        {error && <p className="text-red-500 font-label text-caption mt-1">{error}</p>}
      </div>

      <div className="fixed bottom-0 left-0 w-full px-container-margin pb-10 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent">
        <button
          onClick={handleContinue}
          className="sunset-gradient text-on-primary w-full py-4 rounded-full font-label text-label-md uppercase tracking-widest shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          {user?.has_vibe ? 'Xem gợi ý ngay' : 'Bắt đầu khám phá'}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}
