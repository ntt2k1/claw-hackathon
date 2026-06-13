const TABS = [
  { id: 'explore', icon: '🧭', label: 'Khám phá' },
  { id: 'vibe',    icon: '✨', label: 'Your Vibe' },
  { id: 'itinerary', icon: '📍', label: 'Lịch trình' },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-white/20 shadow-lg">
      <div className="flex justify-around items-center h-16 px-2">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className={`font-label text-[10px] leading-none ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
