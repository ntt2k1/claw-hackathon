const TABS = [
  { id: 'home',    icon: '🏠', label: 'Trang chủ' },
  { id: 'explore', icon: '🧭', label: 'Khám phá' },
  { id: 'dna',     icon: '🧬', label: 'DNA' },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="sticky bottom-0 w-full bg-surface/90 backdrop-blur-2xl border-t border-outline-variant z-50 mt-auto">
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
